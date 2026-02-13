// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Escrow
/// @notice Holds MON for jobs until release (on completion) or refund (on cancel/dispute).
contract Escrow {
    struct JobDeposit {
        address client;
        address agent;
        uint256 amount;
    }

    mapping(bytes32 => JobDeposit) public deposits;
    address public jobMarket;

    event Locked(bytes32 indexed jobId, address client, uint256 amount);
    event AgentSet(bytes32 indexed jobId, address agent);
    event Released(bytes32 indexed jobId, address agent, uint256 amount);
    event Refunded(bytes32 indexed jobId, address client, uint256 amount);

    error OnlyJobMarket();
    error NoDeposit();
    error AgentAlreadySet();
    error TransferFailed();

    modifier onlyJobMarket() {
        if (msg.sender != jobMarket) revert OnlyJobMarket();
        _;
    }

    constructor() {
        jobMarket = address(0);
    }

    function setJobMarket(address _jobMarket) external {
        require(jobMarket == address(0), "already set");
        jobMarket = _jobMarket;
    }

    /// @notice Lock MON for a job. Called by JobMarket when client posts job (with msg.value forwarded).
    function lock(bytes32 jobId, address client) external payable onlyJobMarket {
        require(msg.value > 0, "zero amount");
        require(deposits[jobId].amount == 0, "job already locked");
        deposits[jobId] = JobDeposit({ client: client, agent: address(0), amount: msg.value });
        emit Locked(jobId, client, msg.value);
    }

    /// @notice Set the agent for a job. Called by JobMarket when agent accepts.
    function setAgent(bytes32 jobId, address agent) external onlyJobMarket {
        JobDeposit storage d = deposits[jobId];
        if (d.amount == 0) revert NoDeposit();
        if (d.agent != address(0)) revert AgentAlreadySet();
        d.agent = agent;
        emit AgentSet(jobId, agent);
    }

    /// @notice Release payment to agent. Called by JobMarket on job completion.
    function release(bytes32 jobId) external onlyJobMarket {
        JobDeposit storage d = deposits[jobId];
        if (d.amount == 0) revert NoDeposit();
        address agent = d.agent;
        uint256 amount = d.amount;
        delete deposits[jobId];
        (bool ok,) = payable(agent).call{ value: amount }("");
        if (!ok) revert TransferFailed();
        emit Released(jobId, agent, amount);
    }

    /// @notice Refund client. Called by JobMarket on cancel or dispute.
    function refund(bytes32 jobId) external onlyJobMarket {
        JobDeposit storage d = deposits[jobId];
        if (d.amount == 0) revert NoDeposit();
        address client = d.client;
        uint256 amount = d.amount;
        delete deposits[jobId];
        (bool ok,) = payable(client).call{ value: amount }("");
        if (!ok) revert TransferFailed();
        emit Refunded(jobId, client, amount);
    }

    function getDeposit(bytes32 jobId) external view returns (address client, address agent, uint256 amount) {
        JobDeposit storage d = deposits[jobId];
        return (d.client, d.agent, d.amount);
    }
}
