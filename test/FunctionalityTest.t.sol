// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../contracts/CertVerify.sol";
import "../contracts/CertVerifyOptimized.sol";

contract FunctionalityTest is Test {
    CertificateRegistry public original;
    CertificateRegistryOptimized public optimized;
    
    address public issuer;
    string constant HOLDER_NAME = "Alice Johnson";
    string constant COURSE = "Blockchain Development";
    uint256 constant VALID_UNTIL = 1735689600;
    string constant IPFS_HASH = "QmTestHash123456789";
    
    function setUp() public {
        issuer = makeAddr("issuer");
        
        original = new CertificateRegistry();
        optimized = new CertificateRegistryOptimized();
        
        original.authorizeIssuer(issuer);
        optimized.authorizeIssuer(issuer);
    }
    
    function testContractDeployment() public {
        console.log("=== CONTRACT DEPLOYMENT TEST ===");
        
        assertTrue(address(original) != address(0));
        assertTrue(address(optimized) != address(0));
        assertEq(original.owner(), address(this));
        assertEq(optimized.owner(), address(this));
        
        console.log("SUCCESS: Both contracts deployed successfully");
    }
    
    function testSingleCertificateIssuance() public {
        console.log("\n=== SINGLE CERTIFICATE ISSUANCE TEST ===");
        
        // Test original contract
        vm.prank(issuer);
        bytes32 originalCertId = original.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        
        // Test optimized contract
        vm.prank(issuer);
        bytes32 optimizedCertId = optimized.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        
        // Verify both certificates are valid
        assertTrue(original.isValid(originalCertId));
        assertTrue(optimized.isValid(optimizedCertId));
        
        console.log("SUCCESS: Single certificate issuance works on both contracts");
        console.log("Original Certificate ID:", vm.toString(originalCertId));
        console.log("Optimized Certificate ID:", vm.toString(optimizedCertId));
    }
    
    function testCertificateRevocation() public {
        console.log("\n=== CERTIFICATE REVOCATION TEST ===");
        
        // Issue certificates first
        vm.prank(issuer);
        bytes32 originalCertId = original.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        
        vm.prank(issuer);
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
        
        vm.prank(issuer);
        original.revokeCertificate(originalCertId, revokeReason);
        
        vm.prank(issuer);
        optimized.revokeCertificate(optimizedCertId, revokeReason);
        
        // Verify they are revoked
        assertFalse(original.isValid(originalCertId));
        assertFalse(optimized.isValid(optimizedCertId));
        
        console.log("SUCCESS: Certificate revocation works on both contracts");
    }
    
    function testBatchOperations() public {
        console.log("\n=== BATCH OPERATIONS TEST ===");
        
        bytes32 merkleRoot = keccak256(abi.encodePacked("batch", "test", "data"));
        
        // Test original contract batch issuance
        vm.prank(issuer);
        original.issueBatch(merkleRoot);
        
        // Test optimized contract batch issuance
        vm.prank(issuer);
        optimized.issueBatch(merkleRoot);
        
        // Test batch verification (with empty proof for testing)
        bytes32 leaf = keccak256(abi.encodePacked("test", "leaf"));
        bytes32[] memory proof = new bytes32[](0);
        
        (bool origValid, bool origRevoked) = original.verifyBatchCertificate(merkleRoot, leaf, proof);
        (bool optValid, bool optRevoked) = optimized.verifyBatchCertificate(merkleRoot, leaf, proof);
        
        // Should be false due to empty proof, but function should not revert
        assertFalse(origValid);
        assertFalse(optValid);
        assertFalse(origRevoked);
        assertFalse(optRevoked);
        
        console.log("SUCCESS: Batch operations work on both contracts");
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
        
        console.log("SUCCESS: Access control works on both contracts");
    }
    
    function testGasComparison() public {
        console.log("\n=== GAS COMPARISON TEST ===");
        
        // Test single certificate issuance gas
        uint256 gasBefore = gasleft();
        vm.prank(issuer);
        bytes32 originalCertId = original.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        uint256 originalGas = gasBefore - gasleft();
        
        gasBefore = gasleft();
        vm.prank(issuer);
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
        
        if (optimizedGas > originalGas) {
            console.log("  Gas Increase:", optimizedGas - originalGas);
        } else {
            console.log("  Gas Savings:", originalGas - optimizedGas);
        }
        
        // Test batch issuance gas
        bytes32 merkleRoot = keccak256(abi.encodePacked("gas", "test", "batch"));
        
        gasBefore = gasleft();
        vm.prank(issuer);
        original.issueBatch(merkleRoot);
        uint256 originalBatchGas = gasBefore - gasleft();
        
        gasBefore = gasleft();
        vm.prank(issuer);
        optimized.issueBatch(merkleRoot);
        uint256 optimizedBatchGas = gasBefore - gasleft();
        
        console.log("Batch Issuance:");
        console.log("  Original Gas:", originalBatchGas);
        console.log("  Optimized Gas:", optimizedBatchGas);
        
        if (optimizedBatchGas < originalBatchGas) {
            console.log("  Gas Savings:", originalBatchGas - optimizedBatchGas);
            console.log("  Percentage Savings:", ((originalBatchGas - optimizedBatchGas) * 100) / originalBatchGas, "%");
        } else {
            console.log("  Gas Increase:", optimizedBatchGas - originalBatchGas);
        }
    }
    
    function testContractSizes() public {
        console.log("\n=== CONTRACT SIZE COMPARISON ===");
        
        uint256 originalSize = address(original).code.length;
        uint256 optimizedSize = address(optimized).code.length;
        
        console.log("Contract Sizes:");
        console.log("  Original:", originalSize, "bytes");
        console.log("  Optimized:", optimizedSize, "bytes");
        
        if (optimizedSize > originalSize) {
            console.log("  Size Increase:", optimizedSize - originalSize, "bytes");
        } else {
            console.log("  Size Reduction:", originalSize - optimizedSize, "bytes");
        }
        
        uint256 limit = 24576; // 24KB
        console.log("24KB Limit Check:");
        console.log("  Original under limit:", originalSize < limit);
        console.log("  Optimized under limit:", optimizedSize < limit);
    }
    
    function testMultipleCertificates() public {
        console.log("\n=== MULTIPLE CERTIFICATES TEST ===");
        
        uint256 originalTotal = 0;
        uint256 optimizedTotal = 0;
        
        // Issue 3 certificates with each contract
        for (uint256 i = 0; i < 3; i++) {
            // Original contract
            uint256 gasBefore = gasleft();
            vm.prank(issuer);
            original.issueCertificate(
                string(abi.encodePacked("Holder", i)),
                string(abi.encodePacked("Course", i)),
                VALID_UNTIL,
                string(abi.encodePacked("QmHash", i))
            );
            originalTotal += gasBefore - gasleft();
            
            // Optimized contract
            gasBefore = gasleft();
            vm.prank(issuer);
            optimized.issueCertificate(
                string(abi.encodePacked("Holder", i)),
                string(abi.encodePacked("Course", i)),
                VALID_UNTIL,
                string(abi.encodePacked("QmHash", i))
            );
            optimizedTotal += gasBefore - gasleft();
        }
        
        console.log("Multiple Certificates (3 certs):");
        console.log("  Original Total Gas:", originalTotal);
        console.log("  Optimized Total Gas:", optimizedTotal);
        
        if (optimizedTotal < originalTotal) {
            console.log("  Total Gas Savings:", originalTotal - optimizedTotal);
            console.log("  Percentage Savings:", ((originalTotal - optimizedTotal) * 100) / originalTotal, "%");
            console.log("  Average per Certificate (Original):", originalTotal / 3);
            console.log("  Average per Certificate (Optimized):", optimizedTotal / 3);
        } else {
            console.log("  Total Gas Increase:", optimizedTotal - originalTotal);
        }
    }
}
