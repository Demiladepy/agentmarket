// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title AgentRegistryV2
 * @notice Manages agent registration, metadata, and payment-weighted reputation on Monad.
 * @dev Ported from Amiko X402; avgRating is stored as fixed-point (actual * 10000).
 */
contract AgentRegistryV2 {
    struct Agent {
        address wallet;
        string metadataUri;
        bool active;
        bool autoCreated;
        uint128 totalWeightedRating;
        uint128 totalWeight;
        uint32 avgRating;
        uint64 createdAt;
        uint64 lastUpdate;
    }

    mapping(address => Agent) public agents;
    mapping(address => bool) public isRegistered;
    address public jobMarket;

    event AgentRegistered(address indexed agent, string metadataUri, uint64 timestamp, bool autoCreated);
    event AgentUpdated(address indexed agent, string metadataUri, uint64 timestamp);
    event AgentDeactivated(address indexed agent, uint64 timestamp);
    event ReputationUpdated(address indexed agent, uint32 newAvgRating, uint128 totalWeight);

    error OnlyJobMarket();
    error AlreadyRegistered();
    error NotRegistered();
    error InvalidRating();

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

    function registerAgent(string calldata metadataUri) external {
        if (isRegistered[msg.sender]) revert AlreadyRegistered();
        agents[msg.sender] = Agent({
            wallet: msg.sender,
            metadataUri: metadataUri,
            active: true,
            autoCreated: false,
            totalWeightedRating: 0,
            totalWeight: 0,
            avgRating: 0,
            createdAt: uint64(block.timestamp),
            lastUpdate: uint64(block.timestamp)
        });
        isRegistered[msg.sender] = true;
        emit AgentRegistered(msg.sender, metadataUri, uint64(block.timestamp), false);
    }

    function autoCreateAgent(address agentAddress) external onlyJobMarket {
        if (isRegistered[agentAddress]) revert AlreadyRegistered();
        agents[agentAddress] = Agent({
            wallet: agentAddress,
            metadataUri: "",
            active: true,
            autoCreated: true,
            totalWeightedRating: 0,
            totalWeight: 0,
            avgRating: 0,
            createdAt: uint64(block.timestamp),
            lastUpdate: uint64(block.timestamp)
        });
        isRegistered[agentAddress] = true;
        emit AgentRegistered(agentAddress, "", uint64(block.timestamp), true);
    }

    function updateAgent(string calldata metadataUri) external {
        if (!isRegistered[msg.sender]) revert NotRegistered();
        agents[msg.sender].metadataUri = metadataUri;
        agents[msg.sender].lastUpdate = uint64(block.timestamp);
        emit AgentUpdated(msg.sender, metadataUri, uint64(block.timestamp));
    }

    function deactivateAgent() external {
        if (!isRegistered[msg.sender]) revert NotRegistered();
        agents[msg.sender].active = false;
        agents[msg.sender].lastUpdate = uint64(block.timestamp);
        emit AgentDeactivated(msg.sender, uint64(block.timestamp));
    }

    function updateReputation(address agentAddress, uint8 rating, uint256 paymentAmount) external onlyJobMarket {
        if (!isRegistered[agentAddress]) revert NotRegistered();
        if (rating < 1 || rating > 5) revert InvalidRating();
        Agent storage agent = agents[agentAddress];
        uint128 weightedRating = uint128(rating) * uint128(paymentAmount);
        agent.totalWeightedRating += weightedRating;
        agent.totalWeight += uint128(paymentAmount);
        agent.avgRating = uint32((uint256(agent.totalWeightedRating) * 10000) / uint256(agent.totalWeight));
        agent.lastUpdate = uint64(block.timestamp);
        emit ReputationUpdated(agentAddress, agent.avgRating, agent.totalWeight);
    }

    function getAgent(address agentAddress) external view returns (Agent memory) {
        if (!isRegistered[agentAddress]) revert NotRegistered();
        return agents[agentAddress];
    }
}
