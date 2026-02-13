// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AgentRegistry.sol";
import "./Escrow.sol";

/// @title JobMarket
/// @notice Post jobs, accept, complete, and submit feedback. Integrates AgentRegistry and Escrow.
contract JobMarket {
    AgentRegistry public agentRegistry;
    Escrow public escrow;

    enum JobStatus { Posted, Accepted, Completed, Disputed, Cancelled }

    struct Job {
        bytes32 jobId;
        address client;
        address agent;
        string taskDescription;
        uint256 payment;
        JobStatus status;
    }

    mapping(bytes32 => Job) public jobs;
    mapping(bytes32 => bool) public feedbackSubmitted;
    bytes32[] public jobIds;
    uint256 public nonce;

    event JobPosted(bytes32 indexed jobId, address indexed client, string taskDescription, uint256 payment);
    event JobAccepted(bytes32 indexed jobId, address indexed agent);
    event JobCompleted(bytes32 indexed jobId);
    event JobDisputed(bytes32 indexed jobId);
    event JobCancelled(bytes32 indexed jobId);
    event FeedbackSubmitted(bytes32 indexed jobId, address indexed agent, uint8 rating);

    error NotRegistered();
    error InvalidJob();
    error WrongStatus();
    error NotClient();
    error NotAgent();
    error AlreadyRated();

    modifier onlyRegistered() {
        if (!agentRegistry.isRegistered(msg.sender)) revert NotRegistered();
        _;
    }

    constructor(address _agentRegistry, address _escrow) {
        agentRegistry = AgentRegistry(payable(_agentRegistry));
        escrow = Escrow(payable(_escrow));
    }

    /// @notice Post a new job. Caller must be registered and send payment as msg.value.
    function postJob(string calldata taskDescription, uint256 payment) external payable onlyRegistered {
        require(msg.value == payment && payment > 0, "payment mismatch");
        bytes32 jobId = keccak256(abi.encodePacked(msg.sender, taskDescription, block.timestamp, nonce));
        nonce++;

        jobs[jobId] = Job({
            jobId: jobId,
            client: msg.sender,
            agent: address(0),
            taskDescription: taskDescription,
            payment: payment,
            status: JobStatus.Posted
        });
        jobIds.push(jobId);

        escrow.lock{ value: payment }(jobId, msg.sender);
        emit JobPosted(jobId, msg.sender, taskDescription, payment);
    }

    /// @notice Accept a job. Caller must be registered agent.
    function acceptJob(bytes32 jobId) external onlyRegistered {
        Job storage job = jobs[jobId];
        if (job.client == address(0)) revert InvalidJob();
        if (job.status != JobStatus.Posted) revert WrongStatus();

        job.agent = msg.sender;
        job.status = JobStatus.Accepted;
        escrow.setAgent(jobId, msg.sender);
        emit JobAccepted(jobId, msg.sender);
    }

    /// @notice Mark job complete. Only client can call. Releases payment to agent and updates reputation (rating 0 until feedback).
    function completeJob(bytes32 jobId) external {
        Job storage job = jobs[jobId];
        if (job.client == address(0)) revert InvalidJob();
        if (job.status != JobStatus.Accepted) revert WrongStatus();
        if (job.client != msg.sender) revert NotClient();

        job.status = JobStatus.Completed;
        escrow.release(jobId);
        // Update reputation with 0 rating for now; submitFeedback will not update again for same job if we track it.
        // Plan: updateReputation on complete with a default rating, or only on feedback. We do it on feedback only;
        // so we need to call updateReputation when feedback is submitted. If no feedback, agent still gets paid but no rating change.
        emit JobCompleted(jobId);
    }

    /// @notice Submit rating 1-100 for the agent. Only client, only once per job, only after completed.
    function submitFeedback(bytes32 jobId, uint8 rating) external {
        Job storage job = jobs[jobId];
        if (job.client == address(0)) revert InvalidJob();
        if (job.status != JobStatus.Completed) revert WrongStatus();
        if (job.client != msg.sender) revert NotClient();
        if (feedbackSubmitted[jobId]) revert AlreadyRated();
        require(rating <= 100, "rating 0-100");

        if (job.agent == address(0)) revert InvalidJob();
        feedbackSubmitted[jobId] = true;
        agentRegistry.updateReputation(job.agent, rating, job.payment);
        emit FeedbackSubmitted(jobId, job.agent, rating);
    }

    /// @notice Cancel a posted job (only client, only if still Posted). Refunds client.
    function cancelJob(bytes32 jobId) external {
        Job storage job = jobs[jobId];
        if (job.client != msg.sender) revert NotClient();
        if (job.status != JobStatus.Posted) revert WrongStatus();

        job.status = JobStatus.Cancelled;
        escrow.refund(jobId);
        emit JobCancelled(jobId);
    }

    /// @notice Dispute a job (Accepted -> Disputed). Refunds client. Optional: extend later for arbitration.
    function disputeJob(bytes32 jobId) external {
        Job storage job = jobs[jobId];
        if (job.client != msg.sender) revert NotClient();
        if (job.status != JobStatus.Accepted) revert WrongStatus();

        job.status = JobStatus.Disputed;
        escrow.refund(jobId);
        emit JobDisputed(jobId);
    }

    function getJob(bytes32 jobId) external view returns (
        address client,
        address agent,
        string memory taskDescription,
        uint256 payment,
        JobStatus status
    ) {
        Job storage job = jobs[jobId];
        return (job.client, job.agent, job.taskDescription, job.payment, job.status);
    }

    function getJobCount() external view returns (uint256) {
        return jobIds.length;
    }

    function getJobIdAt(uint256 index) external view returns (bytes32) {
        return jobIds[index];
    }
}
