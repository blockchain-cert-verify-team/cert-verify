// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract CertificateRegistry {
    struct Certificate {
        string holderName;
        string course;
        uint256 issuedAt;
        uint256 validUntil;
        string ipfsHash;
        address issuer;
        bool revoked;
        string revokeReason;
    }

    // Roles
    address public owner;
    mapping(address => bool) public authorizedIssuers;

    // Single certificate mapping (for individually issued certs)
    mapping(bytes32 => Certificate) public certificates;

    // Batch certificate roots storage
    mapping(bytes32 => Batch) public batches;

    struct Batch {
        address issuer;
        uint256 issuedAt;
        bool revoked;
        string revokeReason;
    }

    // Events
    event IssuerAuthorized(address issuer);
    event IssuerRevoked(address issuer);
    event CertificateIssued(
        bytes32 indexed certId,
        string holderName,
        address issuer,
        string ipfsHash
    );
    event BatchIssued(bytes32 indexed merkleRoot, address issuer, uint256 timestamp);
    event CertificateRevoked(bytes32 indexed certId, string reason);
    event BatchRevoked(bytes32 indexed merkleRoot, string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner");
        _;
    }

    modifier onlyIssuer() {
        require(authorizedIssuers[msg.sender], "Not authorized issuer");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
        emit IssuerAuthorized(msg.sender);
    }

    // --- Issuer Role Management ---
    function authorizeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }

    function revokeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer);
    }

    // --- Single Certificate Lifecycle ---
    function issueCertificate(
        string calldata holderName,
        string calldata course,
        uint256 validUntil,
        string calldata ipfsHash
    ) external onlyIssuer returns (bytes32 certId) {
        certId = keccak256(
            abi.encode(holderName, course, block.timestamp, ipfsHash, msg.sender)
        );
        require(certificates[certId].issuedAt == 0, "Certificate exists");

        Certificate storage cert = certificates[certId];
        cert.holderName = holderName;
        cert.course = course;
        cert.issuedAt = block.timestamp;
        cert.validUntil = validUntil;
        cert.ipfsHash = ipfsHash;
        cert.issuer = msg.sender;
        cert.revoked = false;

        emit CertificateIssued(certId, holderName, msg.sender, ipfsHash);
    }

    function revokeCertificate(bytes32 certId, string calldata reason) external onlyIssuer {
        Certificate storage cert = certificates[certId];
        require(cert.issuer == msg.sender, "Not certificate issuer");
        require(!cert.revoked, "Already revoked");
        cert.revoked = true;
        cert.revokeReason = reason;
        emit CertificateRevoked(certId, reason);
    }

    // --- Batch (Merkle Tree) Certificate Issuance ---
    function issueBatch(bytes32 merkleRoot) external onlyIssuer {
        require(batches[merkleRoot].issuedAt == 0, "Batch exists");
        batches[merkleRoot] = Batch({
            issuer: msg.sender,
            issuedAt: block.timestamp,
            revoked: false,
            revokeReason: ""
        });
        emit BatchIssued(merkleRoot, msg.sender, block.timestamp);
    }

    function revokeBatch(bytes32 merkleRoot, string calldata reason) external onlyIssuer {
        Batch storage batch = batches[merkleRoot];
        require(batch.issuer == msg.sender, "Not batch issuer");
        require(!batch.revoked, "Batch already revoked");
        batch.revoked = true;
        batch.revokeReason = reason;
        emit BatchRevoked(merkleRoot, reason);
    }

    // --- Verification ---
    // Verify individual cert against batch merkle root using proof
    function verifyBatchCertificate(
        bytes32 merkleRoot,
        bytes32 leaf,
        bytes32[] calldata proof
    ) public view returns (bool valid, bool revoked) {
        valid = MerkleProof.verify(proof, merkleRoot, leaf);
        if (!valid) return (false, false);

        Batch storage batch = batches[merkleRoot];
        revoked = batch.revoked;
        return (valid, revoked);
    }

    // For single certificates
    function isValid(bytes32 certId) external view returns (bool) {
        Certificate storage cert = certificates[certId];
        return cert.issuedAt > 0 && !cert.revoked &&
            (cert.validUntil == 0 || block.timestamp <= cert.validUntil);
    }

    function getCertificate(bytes32 certId)
        external
        view
        returns (
            string memory holderName,
            string memory course,
            uint256 issuedAt,
            uint256 validUntil,
            string memory ipfsHash,
            address issuer,
            bool revoked,
            string memory revokeReason
        )
    {
        Certificate storage cert = certificates[certId];
        return (
            cert.holderName,
            cert.course,
            cert.issuedAt,
            cert.validUntil,
            cert.ipfsHash,
            cert.issuer,
            cert.revoked,
            cert.revokeReason
        );
    }
}
