// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../contracts/CertVerify.sol";
import "../contracts/CertVerifyOptimized.sol";

/**
 * @title UnifiedCertificateTest
 * @dev Comprehensive test suite that consolidates all functionality from:
 *      - CertVerify.t.sol (gas analysis and edge cases)
 *      - ComprehensiveTest.t.sol (full functionality comparison)
 *      - FunctionalityTest.t.sol (basic functionality tests)
 *      - SimpleGasTest.t.sol (simple gas comparisons)
 */
contract UnifiedCertificateTest is Test {
    // Contract instances
    CertificateRegistry public original;
    CertificateRegistryOptimized public optimized;
    
    // Test addresses
    address public owner;
    address public issuer1;
    address public issuer2;
    address public verifier;
    address public unauthorizedUser;
    
    // Test data constants
    string constant HOLDER_NAME = "Alice Johnson";
    string constant COURSE = "Advanced Blockchain Development";
    uint256 constant VALID_UNTIL = 1735689600; // 2025-01-01
    string constant IPFS_HASH = "QmTestHash123456789abcdef";
    
    // Additional test data for multiple certificates
    string constant HOLDER_NAME_2 = "John Doe";
    string constant COURSE_2 = "Blockchain Development";
    string constant IPFS_HASH_2 = "QmTestHash987654321";
    
    function setUp() public {
        // Initialize addresses
        owner = address(this);
        issuer1 = makeAddr("issuer1");
        issuer2 = makeAddr("issuer2");
        verifier = makeAddr("verifier");
        unauthorizedUser = makeAddr("unauthorized");
        
        // Deploy both contracts
        original = new CertificateRegistry();
        optimized = new CertificateRegistryOptimized();
        
        // Authorize issuers for both contracts
        original.authorizeIssuer(issuer1);
        original.authorizeIssuer(issuer2);
        
        optimized.authorizeIssuer(issuer1);
        optimized.authorizeIssuer(issuer2);
    }
    
    // ========================================
    // CONTRACT DEPLOYMENT TESTS
    // ========================================
    
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
    
    // ========================================
    // ISSUER MANAGEMENT TESTS
    // ========================================
    
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
    
    // ========================================
    // SINGLE CERTIFICATE TESTS
    // ========================================
    
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
        
        // Verify certificate data separately to avoid stack too deep
        _verifyCertificateData(originalCertId, optimizedCertId);
        
        console.log("SUCCESS: Single certificate issuance works on both contracts");
        console.log("  Certificate ID (Original):", vm.toString(originalCertId));
        console.log("  Certificate ID (Optimized):", vm.toString(optimizedCertId));
    }
    
    function _verifyCertificateData(bytes32 originalCertId, bytes32 optimizedCertId) internal {
        // Get and verify original certificate data
        _verifyOriginalCertificateData(originalCertId);
        
        // Get and verify optimized certificate data
        _verifyOptimizedCertificateData(optimizedCertId);
    }
    
    function _verifyOriginalCertificateData(bytes32 certId) internal {
        (
            string memory holder,
            string memory course,
            uint256 issuedAt,
            uint256 validUntil,
            string memory ipfsHash,
            address issuer,
            bool revoked,
            string memory revokeReason
        ) = original.getCertificate(certId);
        
        // Basic assertions
        assertEq(holder, HOLDER_NAME);
        assertEq(course, COURSE);
        assertEq(issuer, issuer1);
        assertFalse(revoked);
    }
    
    function _verifyOptimizedCertificateData(bytes32 certId) internal {
        (
            string memory holder,
            string memory course,
            uint256 issuedAt,
            uint256 validUntil,
            string memory ipfsHash,
            address issuer,
            bool revoked,
            string memory revokeReason
        ) = optimized.getCertificate(certId);
        
        // Basic assertions
        assertEq(holder, HOLDER_NAME);
        assertEq(course, COURSE);
        assertEq(issuer, issuer1);
        assertFalse(revoked);
    }
    
    function testCertificateVerification() public {
        console.log("\n=== CERTIFICATE VERIFICATION TEST ===");
        
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
        
        // Test verification
        assertTrue(original.isValid(originalCertId));
        assertTrue(optimized.isValid(optimizedCertId));
        
        console.log("SUCCESS: Certificate verification works on both contracts");
    }
    
    // ========================================
    // CERTIFICATE REVOCATION TESTS
    // ========================================
    
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
    
    // ========================================
    // BATCH OPERATIONS TESTS
    // ========================================
    
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
        // Note: Using empty proof will make verification fail, but we can still check
        // that the batch exists and is marked as revoked
        bytes32 leaf = keccak256(abi.encodePacked("test", "leaf"));
        bytes32[] memory proof = new bytes32[](0);
        
        (bool origValid, bool origRevoked) = original.verifyBatchCertificate(merkleRoot, leaf, proof);
        (bool optValid, bool optRevoked) = optimized.verifyBatchCertificate(merkleRoot, leaf, proof);
        
        // Since we're using empty proof, verification will fail, but we can check
        // that the batch was properly revoked by checking the batch storage directly
        console.log("Batch verification with empty proof (Original):", origValid, "Revoked:", origRevoked);
        console.log("Batch verification with empty proof (Optimized):", optValid, "Revoked:", optRevoked);
        
        // The important thing is that the revocation transaction succeeded
        // We can verify this by checking that the batch exists and is revoked
        // by trying to revoke it again (should fail)
        vm.prank(issuer1);
        vm.expectRevert("Batch already revoked");
        original.revokeBatch(merkleRoot, "Another reason");
        
        vm.prank(issuer1);
        vm.expectRevert();
        optimized.revokeBatch(merkleRoot, "Another reason");
        
        console.log("SUCCESS: Batch revocation works on both contracts");
    }
    
    // ========================================
    // ACCESS CONTROL TESTS
    // ========================================
    
    function testAccessControl() public {
        console.log("\n=== ACCESS CONTROL TEST ===");
        
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
    
    // ========================================
    // EDGE CASES TESTS
    // ========================================
    
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
        
        // Test revocation by wrong issuer
        vm.prank(issuer2);
        vm.expectRevert("Not certificate issuer");
        original.revokeCertificate(certId, "Wrong issuer");
        
        vm.prank(issuer2);
        vm.expectRevert();
        optimized.revokeCertificate(optCertId, "Wrong issuer");
        
        console.log("SUCCESS: Edge cases handled correctly on both contracts");
    }
    
    // ========================================
    // GAS ANALYSIS TESTS
    // ========================================
    
    function testGasUsageAnalysis() public {
        console.log("\n=== GAS USAGE ANALYSIS ===");
        
        // Test certificate operations
        _testCertificateOperationsGas();
        
        // Test batch operations
        _testBatchOperationsGas();
    }
    
    function _testCertificateOperationsGas() internal {
        // Test certificate issuance gas
        uint256 gasBefore = gasleft();
        vm.prank(issuer1);
        bytes32 certId = original.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        uint256 issueGas = gasBefore - gasleft();
        console.log("Certificate Issuance Gas (Original):", issueGas);
        
        gasBefore = gasleft();
        vm.prank(issuer1);
        bytes32 optCertId = optimized.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        uint256 optIssueGas = gasBefore - gasleft();
        console.log("Certificate Issuance Gas (Optimized):", optIssueGas);
        
        // Test certificate verification gas
        gasBefore = gasleft();
        bool isValid = original.isValid(certId);
        uint256 verifyGas = gasBefore - gasleft();
        console.log("Certificate Verification Gas (Original):", verifyGas);
        
        gasBefore = gasleft();
        bool optIsValid = optimized.isValid(optCertId);
        uint256 optVerifyGas = gasBefore - gasleft();
        console.log("Certificate Verification Gas (Optimized):", optVerifyGas);
        
        // Test certificate revocation gas
        gasBefore = gasleft();
        vm.prank(issuer1);
        original.revokeCertificate(certId, "Test revocation");
        uint256 revokeGas = gasBefore - gasleft();
        console.log("Certificate Revocation Gas (Original):", revokeGas);
        
        gasBefore = gasleft();
        vm.prank(issuer1);
        optimized.revokeCertificate(optCertId, "Test revocation");
        uint256 optRevokeGas = gasBefore - gasleft();
        console.log("Certificate Revocation Gas (Optimized):", optRevokeGas);
    }
    
    function _testBatchOperationsGas() internal {
        // Test batch issuance gas
        bytes32 merkleRoot = keccak256(abi.encodePacked("test", "batch", "root"));
        uint256 gasBefore = gasleft();
        vm.prank(issuer1);
        original.issueBatch(merkleRoot);
        uint256 batchGas = gasBefore - gasleft();
        console.log("Batch Issuance Gas (Original):", batchGas);
        
        gasBefore = gasleft();
        vm.prank(issuer1);
        optimized.issueBatch(merkleRoot);
        uint256 optBatchGas = gasBefore - gasleft();
        console.log("Batch Issuance Gas (Optimized):", optBatchGas);
        
        // Test batch verification gas
        bytes32 leaf = keccak256(abi.encodePacked("test", "leaf"));
        bytes32[] memory proof = new bytes32[](0);
        gasBefore = gasleft();
        (bool valid, bool revoked) = original.verifyBatchCertificate(merkleRoot, leaf, proof);
        uint256 batchVerifyGas = gasBefore - gasleft();
        console.log("Batch Verification Gas (Original):", batchVerifyGas);
        
        gasBefore = gasleft();
        (bool optValid, bool optRevoked) = optimized.verifyBatchCertificate(merkleRoot, leaf, proof);
        uint256 optBatchVerifyGas = gasBefore - gasleft();
        console.log("Batch Verification Gas (Optimized):", optBatchVerifyGas);
    }
    
    function testMultipleCertificatesGas() public {
        console.log("\n=== MULTIPLE CERTIFICATES GAS ANALYSIS ===");
        
        uint256 originalTotal = 0;
        uint256 optimizedTotal = 0;
        uint256 gasBefore;
        
        // Issue 10 certificates with each contract
        for (uint256 i = 0; i < 10; i++) {
            // Original contract
            gasBefore = gasleft();
            vm.prank(issuer1);
            original.issueCertificate(
                string(abi.encodePacked("Holder", i)),
                string(abi.encodePacked("Course", i)),
                VALID_UNTIL,
                string(abi.encodePacked("QmHash", i))
            );
            originalTotal += gasBefore - gasleft();
            
            // Optimized contract
            gasBefore = gasleft();
            vm.prank(issuer1);
            optimized.issueCertificate(
                string(abi.encodePacked("Holder", i)),
                string(abi.encodePacked("Course", i)),
                VALID_UNTIL,
                string(abi.encodePacked("QmHash", i))
            );
            optimizedTotal += gasBefore - gasleft();
        }
        
        console.log("Total Gas for 10 Certificates (Original):", originalTotal);
        console.log("Total Gas for 10 Certificates (Optimized):", optimizedTotal);
        console.log("Average Gas per Certificate (Original):", originalTotal / 10);
        console.log("Average Gas per Certificate (Optimized):", optimizedTotal / 10);
        
        if (optimizedTotal < originalTotal) {
            console.log("Total Gas Savings:", originalTotal - optimizedTotal);
            console.log("Percentage Savings:", ((originalTotal - optimizedTotal) * 100) / originalTotal, "%");
        } else {
            console.log("Total Gas Increase:", optimizedTotal - originalTotal);
            console.log("Percentage Increase:", ((optimizedTotal - originalTotal) * 100) / originalTotal, "%");
        }
    }
    
    function testBatchOperationsGas() public {
        console.log("\n=== BATCH OPERATIONS GAS ANALYSIS ===");
        
        uint256 originalTotal = 0;
        uint256 optimizedTotal = 0;
        uint256 gasBefore;
        
        // Test multiple batch issuances
        for (uint256 i = 0; i < 5; i++) {
            bytes32 merkleRoot = keccak256(abi.encodePacked("batch", i));
            
            gasBefore = gasleft();
            vm.prank(issuer1);
            original.issueBatch(merkleRoot);
            originalTotal += gasBefore - gasleft();
            
            gasBefore = gasleft();
            vm.prank(issuer1);
            optimized.issueBatch(merkleRoot);
            optimizedTotal += gasBefore - gasleft();
        }
        
        console.log("Total Gas for 5 Batches (Original):", originalTotal);
        console.log("Total Gas for 5 Batches (Optimized):", optimizedTotal);
        console.log("Average Gas per Batch (Original):", originalTotal / 5);
        console.log("Average Gas per Batch (Optimized):", optimizedTotal / 5);
        
        if (optimizedTotal < originalTotal) {
            console.log("Total Gas Savings:", originalTotal - optimizedTotal);
            console.log("Percentage Savings:", ((originalTotal - optimizedTotal) * 100) / originalTotal, "%");
        } else {
            console.log("Total Gas Increase:", optimizedTotal - originalTotal);
            console.log("Percentage Increase:", ((optimizedTotal - originalTotal) * 100) / originalTotal, "%");
        }
    }
    
    // ========================================
    // CONTRACT SIZE COMPARISON TESTS
    // ========================================
    
    function testContractSizes() public {
        console.log("\n=== CONTRACT SIZE COMPARISON ===");
        
        uint256 originalSize = address(original).code.length;
        uint256 optimizedSize = address(optimized).code.length;
        
        console.log("Contract Sizes:");
        console.log("  Original:", originalSize, "bytes");
        console.log("  Optimized:", optimizedSize, "bytes");
        
        if (optimizedSize < originalSize) {
            console.log("  Size Reduction:", originalSize - optimizedSize, "bytes");
            console.log("  Percentage Reduction:", ((originalSize - optimizedSize) * 100) / originalSize, "%");
        } else {
            console.log("  Size Increase:", optimizedSize - originalSize, "bytes");
            console.log("  Percentage Increase:", ((optimizedSize - originalSize) * 100) / originalSize, "%");
        }
        
        uint256 limit = 24576; // 24KB
        console.log("24KB Limit Check:");
        console.log("  Original under limit:", originalSize < limit);
        console.log("  Optimized under limit:", optimizedSize < limit);
    }
    
    // ========================================
    // STORAGE OPTIMIZATION TESTS
    // ========================================
    
    function testStorageOptimization() public {
        console.log("\n=== STORAGE OPTIMIZATION ANALYSIS ===");
        
        // Test certificate data retrieval
        vm.prank(issuer1);
        bytes32 certId = original.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        
        uint256 getCertGas = _testGetCertificateGasOriginal(original, certId, "Original");
        
        // Test optimized contract
        vm.prank(issuer1);
        bytes32 optCertId = optimized.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        
        uint256 optGetCertGas = _testGetCertificateGasOptimized(optimized, optCertId, "Optimized");
        
        // Compare gas usage
        if (optGetCertGas < getCertGas) {
            console.log("Gas Savings for getCertificate:", getCertGas - optGetCertGas);
            console.log("Percentage Savings:", ((getCertGas - optGetCertGas) * 100) / getCertGas, "%");
        } else {
            console.log("Gas Increase for getCertificate:", optGetCertGas - getCertGas);
        }
    }
    
    function _testGetCertificateGasOriginal(CertificateRegistry contractInstance, bytes32 certId, string memory contractType) internal returns (uint256) {
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
        ) = contractInstance.getCertificate(certId);
        uint256 getCertGas = gasBefore - gasleft();
        
        console.log("Get Certificate Gas (", contractType, "):", getCertGas);
        console.log("Certificate Data:");
        console.log("  Holder:", holderName);
        console.log("  Course:", course);
        console.log("  Issued At:", issuedAt);
        console.log("  Valid Until:", validUntil);
        console.log("  IPFS Hash:", ipfsHash);
        console.log("  Issuer:", issuer);
        console.log("  Revoked:", revoked);
        
        return getCertGas;
    }
    
    function _testGetCertificateGasOptimized(CertificateRegistryOptimized contractInstance, bytes32 certId, string memory contractType) internal returns (uint256) {
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
        ) = contractInstance.getCertificate(certId);
        uint256 getCertGas = gasBefore - gasleft();
        
        console.log("Get Certificate Gas (", contractType, "):", getCertGas);
        console.log("Certificate Data:");
        console.log("  Holder:", holderName);
        console.log("  Course:", course);
        console.log("  Issued At:", issuedAt);
        console.log("  Valid Until:", validUntil);
        console.log("  IPFS Hash:", ipfsHash);
        console.log("  Issuer:", issuer);
        console.log("  Revoked:", revoked);
        
        return getCertGas;
    }
}
