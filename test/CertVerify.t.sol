// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../contracts/CertVerify.sol";

contract CertVerifyTest is Test {
    CertificateRegistry public certRegistry;
    
    address public owner;
    address public issuer1;
    address public issuer2;
    address public verifier;
    
    // Test data
    string constant HOLDER_NAME = "John Doe";
    string constant COURSE = "Blockchain Development";
    uint256 constant VALID_UNTIL = 1735689600; // 2025-01-01
    string constant IPFS_HASH = "QmTestHash123456789";
    
    function setUp() public {
        owner = address(this);
        issuer1 = makeAddr("issuer1");
        issuer2 = makeAddr("issuer2");
        verifier = makeAddr("verifier");
        
        certRegistry = new CertificateRegistry();
        
        // Authorize issuers
        certRegistry.authorizeIssuer(issuer1);
        certRegistry.authorizeIssuer(issuer2);
    }
    
    function testGasUsage() public {
        console.log("=== GAS USAGE ANALYSIS ===");
        
        // Test certificate issuance gas
        uint256 gasBefore = gasleft();
        vm.prank(issuer1);
        bytes32 certId = certRegistry.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        uint256 issueGas = gasBefore - gasleft();
        console.log("Certificate Issuance Gas:", issueGas);
        
        // Test certificate verification gas
        gasBefore = gasleft();
        bool isValid = certRegistry.isValid(certId);
        uint256 verifyGas = gasBefore - gasleft();
        console.log("Certificate Verification Gas:", verifyGas);
        
        // Test certificate revocation gas
        gasBefore = gasleft();
        vm.prank(issuer1);
        certRegistry.revokeCertificate(certId, "Test revocation");
        uint256 revokeGas = gasBefore - gasleft();
        console.log("Certificate Revocation Gas:", revokeGas);
        
        // Test batch issuance gas
        bytes32 merkleRoot = keccak256(abi.encodePacked("test", "batch", "root"));
        gasBefore = gasleft();
        vm.prank(issuer1);
        certRegistry.issueBatch(merkleRoot);
        uint256 batchGas = gasBefore - gasleft();
        console.log("Batch Issuance Gas:", batchGas);
        
        // Test batch verification gas
        bytes32 leaf = keccak256(abi.encodePacked("test", "leaf"));
        bytes32[] memory proof = new bytes32[](0);
        gasBefore = gasleft();
        (bool valid, bool revoked) = certRegistry.verifyBatchCertificate(merkleRoot, leaf, proof);
        uint256 batchVerifyGas = gasBefore - gasleft();
        console.log("Batch Verification Gas:", batchVerifyGas);
    }
    
    function testMultipleCertificates() public {
        console.log("=== MULTIPLE CERTIFICATES GAS ANALYSIS ===");
        
        uint256 totalGas = 0;
        uint256 gasBefore;
        
        // Issue 10 certificates
        for (uint256 i = 0; i < 10; i++) {
            gasBefore = gasleft();
            vm.prank(issuer1);
            certRegistry.issueCertificate(
                string(abi.encodePacked("Holder", i)),
                string(abi.encodePacked("Course", i)),
                VALID_UNTIL,
                string(abi.encodePacked("QmHash", i))
            );
            totalGas += gasBefore - gasleft();
        }
        
        console.log("Total Gas for 10 Certificates:", totalGas);
        console.log("Average Gas per Certificate:", totalGas / 10);
    }
    
    function testBatchOperations() public {
        console.log("=== BATCH OPERATIONS GAS ANALYSIS ===");
        
        // Test multiple batch issuances
        uint256 totalGas = 0;
        uint256 gasBefore;
        
        for (uint256 i = 0; i < 5; i++) {
            bytes32 merkleRoot = keccak256(abi.encodePacked("batch", i));
            gasBefore = gasleft();
            vm.prank(issuer1);
            certRegistry.issueBatch(merkleRoot);
            totalGas += gasBefore - gasleft();
        }
        
        console.log("Total Gas for 5 Batches:", totalGas);
        console.log("Average Gas per Batch:", totalGas / 5);
    }
    
    function testStorageOptimization() public {
        console.log("=== STORAGE OPTIMIZATION ANALYSIS ===");
        
        // Test certificate data retrieval
        vm.prank(issuer1);
        bytes32 certId = certRegistry.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        
        uint256 gasBefore = gasleft();
        (
            string memory holderName,
            string memory course,
            uint256 issuedAt,
            uint256 validUntil,
            string memory ipfsHash,
            address issuer,
            bool revoked,
            string memory revokeReason
        ) = certRegistry.getCertificate(certId);
        uint256 getCertGas = gasBefore - gasleft();
        
        console.log("Get Certificate Gas:", getCertGas);
        console.log("Certificate Data:");
        console.log("  Holder:", holderName);
        console.log("  Course:", course);
        console.log("  Issued At:", issuedAt);
        console.log("  Valid Until:", validUntil);
        console.log("  IPFS Hash:", ipfsHash);
        console.log("  Issuer:", issuer);
        console.log("  Revoked:", revoked);
    }
    
    function testEdgeCases() public {
        console.log("=== EDGE CASES TESTING ===");
        
        // Test duplicate certificate issuance
        vm.prank(issuer1);
        bytes32 certId = certRegistry.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        
        // Try to issue same certificate again
        vm.prank(issuer1);
        vm.expectRevert("Certificate exists");
        certRegistry.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        
        // Test unauthorized issuer
        vm.prank(verifier);
        vm.expectRevert("Not authorized issuer");
        certRegistry.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        
        // Test revocation by wrong issuer
        vm.prank(issuer2);
        vm.expectRevert("Not certificate issuer");
        certRegistry.revokeCertificate(certId, "Wrong issuer");
        
        console.log("All edge cases handled correctly");
    }
}
