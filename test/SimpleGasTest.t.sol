// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../contracts/CertVerify.sol";
import "../contracts/CertVerifyOptimized.sol";

contract SimpleGasTest is Test {
    CertificateRegistry public original;
    CertificateRegistryOptimized public optimized;
    
    address public issuer;
    string constant HOLDER_NAME = "John Doe";
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
    
    function testCertificateIssuanceGas() public {
        console.log("=== CERTIFICATE ISSUANCE GAS COMPARISON ===");
        
        // Test original contract
        uint256 gasBefore = gasleft();
        vm.prank(issuer);
        bytes32 originalCertId = original.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        uint256 originalGas = gasBefore - gasleft();
        
        // Test optimized contract
        gasBefore = gasleft();
        vm.prank(issuer);
        bytes32 optimizedCertId = optimized.issueCertificate(
            HOLDER_NAME,
            COURSE,
            VALID_UNTIL,
            IPFS_HASH
        );
        uint256 optimizedGas = gasBefore - gasleft();
        
        console.log("Original Contract Gas:", originalGas);
        console.log("Optimized Contract Gas:", optimizedGas);
        
        if (optimizedGas < originalGas) {
            console.log("Gas Savings:", originalGas - optimizedGas);
            console.log("Percentage Savings:", ((originalGas - optimizedGas) * 100) / originalGas, "%");
        } else {
            console.log("Gas Increase:", optimizedGas - originalGas);
            console.log("Percentage Increase:", ((optimizedGas - originalGas) * 100) / originalGas, "%");
        }
    }
    
    function testCertificateVerificationGas() public {
        console.log("\n=== CERTIFICATE VERIFICATION GAS COMPARISON ===");
        
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
        
        // Test original contract verification
        uint256 gasBefore = gasleft();
        bool originalValid = original.isValid(originalCertId);
        uint256 originalGas = gasBefore - gasleft();
        
        // Test optimized contract verification
        gasBefore = gasleft();
        bool optimizedValid = optimized.isValid(optimizedCertId);
        uint256 optimizedGas = gasBefore - gasleft();
        
        console.log("Original Contract Verification Gas:", originalGas);
        console.log("Optimized Contract Verification Gas:", optimizedGas);
        
        if (optimizedGas < originalGas) {
            console.log("Gas Savings:", originalGas - optimizedGas);
            console.log("Percentage Savings:", ((originalGas - optimizedGas) * 100) / originalGas, "%");
        } else {
            console.log("Gas Increase:", optimizedGas - originalGas);
            console.log("Percentage Increase:", ((optimizedGas - originalGas) * 100) / originalGas, "%");
        }
        
        // Verify both are valid
        assertTrue(originalValid);
        assertTrue(optimizedValid);
    }
    
    function testBatchIssuanceGas() public {
        console.log("\n=== BATCH ISSUANCE GAS COMPARISON ===");
        
        bytes32 merkleRoot = keccak256(abi.encodePacked("test", "batch", "root"));
        
        // Test original contract
        uint256 gasBefore = gasleft();
        vm.prank(issuer);
        original.issueBatch(merkleRoot);
        uint256 originalGas = gasBefore - gasleft();
        
        // Test optimized contract
        gasBefore = gasleft();
        vm.prank(issuer);
        optimized.issueBatch(merkleRoot);
        uint256 optimizedGas = gasBefore - gasleft();
        
        console.log("Original Contract Batch Gas:", originalGas);
        console.log("Optimized Contract Batch Gas:", optimizedGas);
        
        if (optimizedGas < originalGas) {
            console.log("Gas Savings:", originalGas - optimizedGas);
            console.log("Percentage Savings:", ((originalGas - optimizedGas) * 100) / originalGas, "%");
        } else {
            console.log("Gas Increase:", optimizedGas - originalGas);
            console.log("Percentage Increase:", ((optimizedGas - originalGas) * 100) / originalGas, "%");
        }
    }
    
    function testContractSize() public {
        console.log("\n=== CONTRACT SIZE COMPARISON ===");
        
        uint256 originalSize = address(original).code.length;
        uint256 optimizedSize = address(optimized).code.length;
        
        console.log("Original Contract Size:", originalSize, "bytes");
        console.log("Optimized Contract Size:", optimizedSize, "bytes");
        
        if (optimizedSize < originalSize) {
            console.log("Size Reduction:", originalSize - optimizedSize, "bytes");
            console.log("Percentage Reduction:", ((originalSize - optimizedSize) * 100) / originalSize, "%");
        } else {
            console.log("Size Increase:", optimizedSize - originalSize, "bytes");
            console.log("Percentage Increase:", ((optimizedSize - originalSize) * 100) / originalSize, "%");
        }
        
        // Check 24KB limit
        uint256 limit = 24576;
        console.log("\n24KB Limit Check:");
        console.log("Original under limit:", originalSize < limit);
        console.log("Optimized under limit:", optimizedSize < limit);
    }
    
    function testMultipleCertificates() public {
        console.log("\n=== MULTIPLE CERTIFICATES GAS COMPARISON ===");
        
        uint256 originalTotal = 0;
        uint256 optimizedTotal = 0;
        
        // Issue 5 certificates with each contract
        for (uint256 i = 0; i < 5; i++) {
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
        
        console.log("Original Total Gas (5 certs):", originalTotal);
        console.log("Optimized Total Gas (5 certs):", optimizedTotal);
        
        if (optimizedTotal < originalTotal) {
            console.log("Total Gas Savings:", originalTotal - optimizedTotal);
            console.log("Percentage Savings:", ((originalTotal - optimizedTotal) * 100) / originalTotal, "%");
            console.log("Average Gas per Certificate (Original):", originalTotal / 5);
            console.log("Average Gas per Certificate (Optimized):", optimizedTotal / 5);
        } else {
            console.log("Total Gas Increase:", optimizedTotal - originalTotal);
            console.log("Percentage Increase:", ((optimizedTotal - originalTotal) * 100) / originalTotal, "%");
        }
    }
}
