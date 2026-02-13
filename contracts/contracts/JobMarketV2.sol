// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AgentRegistryV2.sol";

contract JobMarketV2 {
    AgentRegistryV2 public agentRegistry;

    enum JobStatus { Open, Accepted, Completed, Disputed, Cancelled }

    struct Job {
        bytes32 jobId;
        address client;
        address agent;
        string description;
        string skillsRequired;
        uint256 payment;
        JobStatus status;
        uint64 postedAt;
        uint64 acceptedAt;
        uint64 completedAt;
        string deliverableUri;
    }

    struct Feedback {
        bytes32 jobId;
        address client;
        address agent;
        uint8 rating;
        string commentUri;
        bytes32 proofOfPayment;
        uint256 paymentAmount;
        uint64 timestamp;
    }

    mapping(bytes32 => Job) public jobs;
    mapping(bytes32 => Feedback) public feedback;
    mapping(bytes32 => bool) public feedbackSubmitted;
    bytes32[] public jobIds;

    event JobPosted(bytes32 indexed jobId, address indexed client, string description, uint256 payment, uint64 timestamp);
    event JobAccepted(bytes32 indexed jobId, address indexed agent, uint64 timestamp);
    event JobCompleted(bytes32 indexed jobId, string deliverableUri, uint64 timestamp);
    event FeedbackSubmitted(bytes32 indexed jobId, address indexed client, address indexed agent, uint8 rating, uint64 timestamp);
    event JobCancelled(bytes32 indexed jobId, uint64 timestamp);

    error InvalidJob();
    error WrongStatus();
    error NotClient();
    error NotAgent();
    error AlreadyRated();
    error InvalidRating();

    constructor(address _agentRegistry) {
        agentRegistry = AgentRegistryV2(payable(_agentRegistry));
    }

    uint256 private _nonce;

    function postJob(string calldata description, string calldata skillsRequired, uint256 payment) external payable returns (bytes32) {
        require(msg.value == payment && payment > 0, "payment mismatch");
        bytes32 jobId = keccak256(abi.encodePacked(msg.sender, block.timestamp, description, _nonce));
        _nonce++;
        jobs[jobId] = Job({
            jobId: jobId,
            client: msg.sender,
            agent: address(0),
            description: description,
            skillsRequired: skillsRequired,
            payment: payment,
            status: JobStatus.Open,
            postedAt: uint64(block.timestamp),
            acceptedAt: 0,
            completedAt: 0,
            deliverableUri: ""
        });
        jobIds.push(jobId);
        emit JobPosted(jobId, msg.sender, description, payment, uint64(block.timestamp));
        return jobId;
    }

    function acceptJob(bytes32 jobId) external {
        Job storage job = jobs[jobId];
        if (job.client == address(0)) revert InvalidJob();
        if (job.status != JobStatus.Open) revert WrongStatus();
        if (!agentRegistry.isRegistered(msg.sender)) {
            agentRegistry.autoCreateAgent(msg.sender);
        }
        job.agent = msg.sender;
        job.status = JobStatus.Accepted;
        job.acceptedAt = uint64(block.timestamp);
        emit JobAccepted(jobId, msg.sender, uint64(block.timestamp));
    }

    function completeJob(bytes32 jobId, string calldata deliverableUri) external {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Accepted) revert WrongStatus();
        if (job.agent != msg.sender) revert NotAgent();
        job.status = JobStatus.Completed;
        job.completedAt = uint64(block.timestamp);
        job.deliverableUri = deliverableUri;
        (bool ok,) = payable(job.agent).call{ value: job.payment }("");
        require(ok, "transfer failed");
        emit JobCompleted(jobId, deliverableUri, uint64(block.timestamp));
    }

    function submitFeedback(bytes32 jobId, uint8 rating, string calldata commentUri, bytes32 proofOfPayment) external {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Completed) revert WrongStatus();
        if (job.client != msg.sender) revert NotClient();
        if (feedbackSubmitted[jobId]) revert AlreadyRated();
        if (rating < 1 || rating > 5) revert InvalidRating();
        feedback[jobId] = Feedback({
            jobId: jobId,
            client: msg.sender,
            agent: job.agent,
            rating: rating,
            commentUri: commentUri,
            proofOfPayment: proofOfPayment,
            paymentAmount: job.payment,
            timestamp: uint64(block.timestamp)
        });
        feedbackSubmitted[jobId] = true;
        agentRegistry.updateReputation(job.agent, rating, job.payment);
        emit FeedbackSubmitted(jobId, msg.sender, job.agent, rating, uint64(block.timestamp));
    }

    function cancelJob(bytes32 jobId) external {
        Job storage job = jobs[jobId];
        if (job.client != msg.sender) revert NotClient();
        if (job.status != JobStatus.Open) revert WrongStatus();
        job.status = JobStatus.Cancelled;
        (bool ok,) = payable(job.client).call{ value: job.payment }("");
        require(ok, "refund failed");
        emit JobCancelled(jobId, uint64(block.timestamp));
    }

    function getJob(bytes32 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }

    function getFeedback(bytes32 jobId) external view returns (Feedback memory) {
        require(feedbackSubmitted[jobId], "no feedback");
        return feedback[jobId];
    }

    function getJobCount() external view returns (uint256) {
        return jobIds.length;
    }

    function getJobIdAt(uint256 index) external view returns (bytes32) {
        return jobIds[index];
    }
}
