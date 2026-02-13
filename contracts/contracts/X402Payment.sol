// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title X402Payment
 * @notice Records X402 micropayment verification and job linkage for facilitator.
 */
contract X402Payment {
    struct Payment {
        bytes32 paymentId;
        address from;
        address to;
        uint256 amount;
        bytes32 jobId;
        uint64 timestamp;
        bool verified;
    }

    mapping(bytes32 => Payment) public payments;
    mapping(bytes32 => bool) public paymentProcessed;
    address public facilitator;

    event PaymentProcessed(bytes32 indexed paymentId, address indexed from, address indexed to, uint256 amount, bytes32 jobId, uint64 timestamp);

    error OnlyFacilitator();
    error AlreadyProcessed();
    error PaymentNotFound();

    modifier onlyFacilitator() {
        if (msg.sender != facilitator) revert OnlyFacilitator();
        _;
    }

    constructor(address _facilitator) {
        facilitator = _facilitator;
    }

    function processPayment(bytes32 paymentId, address from, address to, uint256 amount, bytes32 jobId) external onlyFacilitator {
        if (paymentProcessed[paymentId]) revert AlreadyProcessed();
        payments[paymentId] = Payment({
            paymentId: paymentId,
            from: from,
            to: to,
            amount: amount,
            jobId: jobId,
            timestamp: uint64(block.timestamp),
            verified: true
        });
        paymentProcessed[paymentId] = true;
        emit PaymentProcessed(paymentId, from, to, amount, jobId, uint64(block.timestamp));
    }

    function verifyPayment(bytes32 paymentId) external view returns (bool) {
        return payments[paymentId].verified;
    }

    function getPayment(bytes32 paymentId) external view returns (Payment memory) {
        if (!paymentProcessed[paymentId]) revert PaymentNotFound();
        return payments[paymentId];
    }
}
