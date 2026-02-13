// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title AgentRegistry
/// @notice On-chain registry of agents (wallets) with metadata and reputation.
contract AgentRegistry {
    struct Agent {
        address wallet;
        string metadataUri;
        uint256 avgRating;   // 0-100 scale, running average
        uint256 totalRatings;
        uint256 totalJobs;
        uint256 totalEarned;
        bool active;
    }

    mapping(address => Agent) public agents;
    address public jobMarket;

    event AgentRegistered(address indexed agent, string metadataUri);
    event AgentUpdated(address indexed agent, string metadataUri, bool active);
    event ReputationUpdated(address indexed agent, uint8 rating, uint256 payment);

    error OnlyJobMarket();
    error AlreadyRegistered();
    error NotRegistered();

    modifier onlyJobMarket() {
        if (msg.sender != jobMarket) revert OnlyJobMarket();
        _;
    }

    constructor() {
        jobMarket = address(0);
    }

    /// @notice Set the JobMarket contract (call once after deployment).
    function setJobMarket(address _jobMarket) external {
        require(jobMarket == address(0), "already set");
        jobMarket = _jobMarket;
    }

    /// @notice Register as an agent. Caller must not already be registered.
    function registerAgent(string calldata metadataUri) external {
        if (agents[msg.sender].wallet != address(0)) revert AlreadyRegistered();
        agents[msg.sender] = Agent({
            wallet: msg.sender,
            metadataUri: metadataUri,
            avgRating: 0,
            totalRatings: 0,
            totalJobs: 0,
            totalEarned: 0,
            active: true
        });
        emit AgentRegistered(msg.sender, metadataUri);
    }

    /// @notice Update metadata and/or active status.
    function updateAgent(string calldata metadataUri, bool active) external {
        if (agents[msg.sender].wallet == address(0)) revert NotRegistered();
        agents[msg.sender].metadataUri = metadataUri;
        agents[msg.sender].active = active;
        emit AgentUpdated(msg.sender, metadataUri, active);
    }

    /// @notice Called by JobMarket when a job is completed. Updates reputation.
    /// @param agent The agent that completed the job
    /// @param rating 1-5 or 0-100 (use same scale consistently; we use 0-100)
    /// @param payment Amount paid for the job (for totalEarned)
    function updateReputation(address agent, uint8 rating, uint256 payment) external onlyJobMarket {
        Agent storage a = agents[agent];
        if (a.wallet == address(0)) revert NotRegistered();

        a.totalJobs += 1;
        a.totalEarned += payment;
        a.totalRatings += 1;
        // Running average: avgRating = (avgRating * (totalRatings-1) + rating) / totalRatings
        a.avgRating = (a.avgRating * (a.totalRatings - 1) + rating) / a.totalRatings;

        emit ReputationUpdated(agent, rating, payment);
    }

    function isRegistered(address account) external view returns (bool) {
        return agents[account].wallet != address(0) && agents[account].active;
    }

    function getAgent(address account) external view returns (
        address wallet,
        string memory metadataUri,
        uint256 avgRating,
        uint256 totalRatings,
        uint256 totalJobs,
        uint256 totalEarned,
        bool active
    ) {
        Agent storage a = agents[account];
        return (
            a.wallet,
            a.metadataUri,
            a.avgRating,
            a.totalRatings,
            a.totalJobs,
            a.totalEarned,
            a.active
        );
    }
}
