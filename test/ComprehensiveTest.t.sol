// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../contracts/CertVerify.sol";
import "../contracts/CertVerifyOptimized.sol";

contract ComprehensiveTest is Test {
    CertificateRegistry public original;
    CertificateRegistryOptimized public optimized;
    
    address public owner;
    address public issuer1;
    address public issuer2;
    address public verifier;
    
    // Test data
    string constant HOLDER_NAME = "Alice Johnson";
    string constant COURSE = "Advanced Blockchain Development";
    uint256 constant VALID_UNTIL = 1735689600; // 2025-01-01
    string constant IPFS_HASH = "QmTestHash123456789abcdef";
    
    function setUp() public {
        owner = address(this);
        issuer1 = makeAddr("issuer1");
        issuer2 = makeAddr("issuer2");
        verifier = makeAddr("verifier");
        
        // Deploy both contracts
        original = new CertificateRegistry();
        optimized = new CertificateRegistryOptimized();
        
        // Authorize issuers for both contracts
        original.authorizeIssuer(issuer1);
        original.authorizeIssuer(issuer2);
        
        optimized.authorizeIssuer(issuer1);
        optimized.authorizeIssuer(issuer2);
    }
    
    function testContractDeployment() public {
        console.log("=== CONTRACT DEPLOYMENT TEST ===");
        
        // Test original contract deployment
        assertTrue(address(original) != address(0));
        assertEq(original.owner(), owner);
        assertTrue(original.authorizedIssuers(owner));
        
        // Test optimized contract deployment
        assertTrue(address(optimized) != address(0));
        assertEq(optimized.owner(), owner);
        assertTrue(optimized.authorizedIssuers(owner));
        
        console.log("SUCCESS: Both contracts deployed successfully");
    }
    
    function testIssuerManagement() public {
        console.log("\n=== ISSUER MANAGEMENT TEST ===");
        
        address newIssuer = makeAddr("newIssuer");
        
        // Test original contract
        original.authorizeIssuer(newIssuer);
        assertTrue(original.authorizedIssuers(newIssuer));
        
        original.revokeIssuer(newIssuer);
        assertFalse(original.authorizedIssuers(newIssuer));
        
        // Test optimized contract
        optimized.authorizeIssuer(newIssuer);
        assertTrue(optimized.authorizedIssuers(newIssuer));
        
        optimized.revokeIssuer(newIssuer);
        assertFalse(optimized.authorizedIssuers(newIssuer));
        
        console.log("SUCCESS: Issuer management works on both contracts");
    }
    
    function testSingleCertificateIssuance() public {
        console.log("\n=== SINGLE CERTIFICATE ISSUANCE TEST ===");
        
        // Test original contract
        vm.prank(issuer1);
        bytes32 originalCertId = original.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        
        // Test optimized contract
        vm.prank(issuer1);
        bytes32 optimizedCertId = optimized.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        
        // Verify both certificates exist
        assertTrue(original.isValid(originalCertId));
        assertTrue(optimized.isValid(optimizedCertId));
        
        // Verify certificate data
        (
            string memory origHolder,
            string memory origCourse,
            uint256 origIssuedAt,
            uint256 origValidUntil,
            string memory origIpfsHash,
            address origIssuer,
            bool origRevoked,
            string memory origRevokeReason
        ) = original.getCertificate(originalCertId);
        
        (
            string memory optHolder,
            string memory optCourse,
            uint256 optIssuedAt,
            uint256 optValidUntil,
            string memory optIpfsHash,
            address optIssuer,
            bool optRevoked,
            string memory optRevokeReason
        ) = optimized.getCertificate(optimizedCertId);
        
        // Compare data
        assertEq(origHolder, optHolder);
        assertEq(origCourse, optCourse);
        assertEq(origIssuer, optIssuer);
        assertEq(origIssuedAt, optIssuedAt);
        assertEq(origValidUntil, optValidUntil);
        assertFalse(origRevoked);
        assertFalse(optRevoked);
        
        console.log("SUCCESS: Single certificate issuance works on both contracts");
        console.log("  Certificate ID (Original):", vm.toString(originalCertId));
        console.log("  Certificate ID (Optimized):", vm.toString(optimizedCertId));
    }
    
    function testCertificateRevocation() public {
        console.log("\n=== CERTIFICATE REVOCATION TEST ===");
        
        // Issue certificates first
        vm.prank(issuer1);
        bytes32 originalCertId = original.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        
        vm.prank(issuer1);
        bytes32 optimizedCertId = optimized.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        
        // Verify they are valid initially
        assertTrue(original.isValid(originalCertId));
        assertTrue(optimized.isValid(optimizedCertId));
        
        // Revoke certificates
        string memory revokeReason = "Certificate compromised";
        
        vm.prank(issuer1);
        original.revokeCertificate(originalCertId, revokeReason);
        
        vm.prank(issuer1);
        optimized.revokeCertificate(optimizedCertId, revokeReason);
        
        // Verify they are revoked
        assertFalse(original.isValid(originalCertId));
        assertFalse(optimized.isValid(optimizedCertId));
        
        // Check revocation data
        (,,,,,, bool origRevoked, string memory origRevokeReason) = original.getCertificate(originalCertId);
        (,,,,,, bool optRevoked, string memory optRevokeReason) = optimized.getCertificate(optimizedCertId);
        
        assertTrue(origRevoked);
        assertTrue(optRevoked);
        assertEq(origRevokeReason, revokeReason);
        assertEq(optRevokeReason, revokeReason);
        
        console.log("SUCCESS: Certificate revocation works on both contracts");
    }
    
    function testBatchOperations() public {
        console.log("\n=== BATCH OPERATIONS TEST ===");
        
        // Create test merkle roots
        bytes32 merkleRoot1 = keccak256(abi.encodePacked("batch1", "test", "data"));
        bytes32 merkleRoot2 = keccak256(abi.encodePacked("batch2", "test", "data"));
        
        // Test original contract batch issuance
        vm.prank(issuer1);
        original.issueBatch(merkleRoot1);
        
        vm.prank(issuer2);
        original.issueBatch(merkleRoot2);
        
        // Test optimized contract batch issuance
        vm.prank(issuer1);
        optimized.issueBatch(merkleRoot1);
        
        vm.prank(issuer2);
        optimized.issueBatch(merkleRoot2);
        
        // Test batch verification
        bytes32 leaf = keccak256(abi.encodePacked("test", "leaf", "data"));
        bytes32[] memory proof = new bytes32[](0); // Empty proof for testing
        
        (bool origValid, bool origRevoked) = original.verifyBatchCertificate(merkleRoot1, leaf, proof);
        (bool optValid, bool optRevoked) = optimized.verifyBatchCertificate(merkleRoot1, leaf, proof);
        
        // Note: These will be false because we're using empty proof, but the function should not revert
        assertFalse(origValid);
        assertFalse(optValid);
        assertFalse(origRevoked);
        assertFalse(optRevoked);
        
        console.log("SUCCESS: Batch operations work on both contracts");
    }
    
    function testBatchRevocation() public {
        console.log("\n=== BATCH REVOCATION TEST ===");
        
        bytes32 merkleRoot = keccak256(abi.encodePacked("batch", "revocation", "test"));
        string memory revokeReason = "Batch compromised";
        
        // Issue batches first
        vm.prank(issuer1);
        original.issueBatch(merkleRoot);
        
        vm.prank(issuer1);
        optimized.issueBatch(merkleRoot);
        
        // Revoke batches
        vm.prank(issuer1);
        original.revokeBatch(merkleRoot, revokeReason);
        
        vm.prank(issuer1);
        optimized.revokeBatch(merkleRoot, revokeReason);
        
        // Test batch verification after revocation
        bytes32 leaf = keccak256(abi.encodePacked("test", "leaf"));
        bytes32[] memory proof = new bytes32[](0);
        
        (bool origValid, bool origRevoked) = original.verifyBatchCertificate(merkleRoot, leaf, proof);
        (bool optValid, bool optRevoked) = optimized.verifyBatchCertificate(merkleRoot, leaf, proof);
        
        // Should be revoked
        assertFalse(origValid);
        assertFalse(optValid);
        assertTrue(origRevoked);
        assertTrue(optRevoked);
        
        console.log("SUCCESS: Batch revocation works on both contracts");
    }
    
    function testAccessControl() public {
        console.log("\n=== ACCESS CONTROL TEST ===");
        
        address unauthorizedUser = makeAddr("unauthorized");
        
        // Test unauthorized certificate issuance
        vm.prank(unauthorizedUser);
        vm.expectRevert("Not authorized issuer");
        original.issueCertificate(HOLDER_NAME, COURSE, VALID_UNTIL, IPFS_HASH);
        
        vm.prank(unauthorizedUser);
        vm.expectRevert();
        optimized.issueCertificate(HOLDER_NAME, COURSE, VALID_UNTIL, IPFS_HASH);
        
        // Test unauthorized issuer management
        vm.prank(unauthorizedUser);
        vm.expectRevert("Only contract owner");
        original.authorizeIssuer(unauthorizedUser);
        
        vm.prank(unauthorizedUser);
        vm.expectRevert();
        optimized.authorizeIssuer(unauthorizedUser);
        
        console.log("SUCCESS: Access control works on both contracts");
    }
    
    function testEdgeCases() public {
        console.log("\n=== EDGE CASES TEST ===");
        
        // Test duplicate certificate issuance
        vm.prank(issuer1);
        bytes32 certId = original.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        
        vm.prank(issuer1);
        vm.expectRevert("Certificate exists");
        original.issueCertificate(HOLDER_NAME, COURSE, VALID_UNTIL, IPFS_HASH);
        
        vm.prank(issuer1);
        bytes32 optCertId = optimized.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        
        vm.prank(issuer1);
        vm.expectRevert();
        optimized.issueCertificate(HOLDER_NAME, COURSE, VALID_UNTIL, IPFS_HASH);
        
        // Test revocation of non-existent certificate
        bytes32 nonExistentCert = keccak256(abi.encodePacked("non", "existent"));
        
        vm.prank(issuer1);
        vm.expectRevert("Not certificate issuer");
        original.revokeCertificate(nonExistentCert, "Test");
        
        vm.prank(issuer1);
        vm.expectRevert();
        optimized.revokeCertificate(nonExistentCert, "Test");
        
        console.log("SUCCESS: Edge cases handled correctly on both contracts");
    }
    
    function testGasComparison() public {
        console.log("\n=== GAS COMPARISON TEST ===");
        
        // Test single certificate issuance gas
        uint256 gasBefore = gasleft();
        vm.prank(issuer1);
        bytes32 originalCertId = original.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        uint256 originalGas = gasBefore - gasleft();
        
        gasBefore = gasleft();
        vm.prank(issuer1);
        bytes32 optimizedCertId = optimized.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        uint256 optimizedGas = gasBefore - gasleft();
        
        console.log("Single Certificate Issuance:");
        console.log("  Original Gas:", originalGas);
        console.log("  Optimized Gas:", optimizedGas);
        console.log("  Difference:", optimizedGas > originalGas ? optimizedGas - originalGas : originalGas - optimizedGas);
        
        // Test batch issuance gas
        bytes32 merkleRoot = keccak256(abi.encodePacked("gas", "test", "batch"));
        
        gasBefore = gasleft();
        vm.prank(issuer1);
        original.issueBatch(merkleRoot);
        uint256 originalBatchGas = gasBefore - gasleft();
        
        gasBefore = gasleft();
        vm.prank(issuer1);
        optimized.issueBatch(merkleRoot);
        uint256 optimizedBatchGas = gasBefore - gasleft();
        
        console.log("Batch Issuance:");
        console.log("  Original Gas:", originalBatchGas);
        console.log("  Optimized Gas:", optimizedBatchGas);
        console.log("  Savings:", originalBatchGas - optimizedBatchGas);
        console.log("  Percentage Savings:", ((originalBatchGas - optimizedBatchGas) * 100) / originalBatchGas, "%");
    }
    
    function testContractSizes() public {
        console.log("\n=== CONTRACT SIZE COMPARISON ===");
        
        uint256 originalSize = address(original).code.length;
        uint256 optimizedSize = address(optimized).code.length;
        
        console.log("Contract Sizes:");
        console.log("  Original:", originalSize, "bytes");
        console.log("  Optimized:", optimizedSize, "bytes");
        console.log("  Difference:", optimizedSize > originalSize ? optimizedSize - originalSize : originalSize - optimizedSize);
        
        uint256 limit = 24576; // 24KB
        console.log("24KB Limit Check:");
        console.log("  Original under limit:", originalSize < limit);
        console.log("  Optimized under limit:", optimizedSize < limit);
    }
}
