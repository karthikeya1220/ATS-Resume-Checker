"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForNewResumes = exports.assignRecruiters = exports.getAllResumesForMatching = exports.updateCandidateStatus = exports.saveJobCandidates = exports.getJobCandidates = exports.deleteJob = exports.updateJob = exports.createJob = exports.getJobById = exports.getAllJobs = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Job_1 = __importDefault(require("../models/Job"));
const JobCandidate_1 = __importDefault(require("../models/JobCandidate"));
const Resume_1 = __importDefault(require("../models/Resume"));
const auth_helpers_1 = require("../utils/auth-helpers");
const User_1 = __importDefault(require("../models/User"));
// Get all jobs
const getAllJobs = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Get query parameters
        const status = req.query.status;
        // Build query object
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        // Find all jobs
        const jobs = await Job_1.default.find(query).sort({ created_at: -1 });
        res.status(200).json(jobs);
    }
    catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};
exports.getAllJobs = getAllJobs;
// Get job by ID
const getJobById = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const job = await Job_1.default.findById(id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.status(200).json(job);
    }
    catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ error: 'Failed to fetch job' });
    }
};
exports.getJobById = getJobById;
// Create a new job
const createJob = async (req, res) => {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        const userEmail = (_b = req.user) === null || _b === void 0 ? void 0 : _b.email;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Create new job with metadata
        const jobData = {
            ...req.body,
            metadata: {
                created_by: userEmail,
                created_by_id: userId,
                last_modified_by: userEmail,
            }
        };
        const job = new Job_1.default(jobData);
        await job.save();
        res.status(201).json(job);
    }
    catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ error: 'Failed to create job' });
    }
};
exports.createJob = createJob;
// Update an existing job
const updateJob = async (req, res) => {
    var _a, _b, _c, _d;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        const userEmail = (_b = req.user) === null || _b === void 0 ? void 0 : _b.email;
        const userRole = (_c = req.user) === null || _c === void 0 ? void 0 : _c.role;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const job = await Job_1.default.findById(id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        // Check if user can modify this job
        const isAuthorized = (0, auth_helpers_1.isAdminUser)(userRole) || (0, auth_helpers_1.canModifyResource)(userId, (_d = job.metadata) === null || _d === void 0 ? void 0 : _d.created_by_id);
        if (!isAuthorized) {
            return res.status(403).json({ error: 'Not authorized to update this job' });
        }
        // Update job data
        const updatedJobData = {
            ...req.body,
            'metadata.last_modified_by': userEmail,
        };
        const updatedJob = await Job_1.default.findByIdAndUpdate(id, updatedJobData, { new: true });
        res.status(200).json(updatedJob);
    }
    catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ error: 'Failed to update job' });
    }
};
exports.updateJob = updateJob;
// Delete a job
const deleteJob = async (req, res) => {
    var _a, _b, _c;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const job = await Job_1.default.findById(id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        // Check if user can delete this job
        const isAuthorized = (0, auth_helpers_1.isAdminUser)(userRole) || (0, auth_helpers_1.canModifyResource)(userId, (_c = job.metadata) === null || _c === void 0 ? void 0 : _c.created_by_id);
        if (!isAuthorized) {
            return res.status(403).json({ error: 'Not authorized to delete this job' });
        }
        // Delete job
        await Job_1.default.findByIdAndDelete(id);
        // Also delete any associated candidates
        await JobCandidate_1.default.deleteMany({ jobId: id });
        res.status(200).json({ message: 'Job deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ error: 'Failed to delete job' });
    }
};
exports.deleteJob = deleteJob;
// Get job candidates
const getJobCandidates = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Find the job to ensure it exists
        const job = await Job_1.default.findById(id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        // Find candidates from the JobCandidate collection
        const candidates = await JobCandidate_1.default.find({ jobId: id }).sort({ 'matchAnalysis.matchPercentage': -1 });
        res.status(200).json(candidates);
    }
    catch (error) {
        console.error('Error fetching job candidates:', error);
        res.status(500).json({ error: 'Failed to fetch job candidates' });
    }
};
exports.getJobCandidates = getJobCandidates;
// Save a list of analyzed candidate matches to the database
const saveJobCandidates = async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const { id } = req.params;
        const { candidates } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Find the job
        const job = await Job_1.default.findById(id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        // Check if valid candidates array was provided
        if (!Array.isArray(candidates) || candidates.length === 0) {
            return res.status(400).json({ error: 'Invalid candidates data' });
        }
        console.log(`Saving ${candidates.length} candidates for job ${id}`);
        // First, find all existing candidates to preserve tracking data
        const existingCandidates = await JobCandidate_1.default.find({
            jobId: id,
            filename: { $in: candidates.map(c => c.filename) }
        });
        console.log(`Found ${existingCandidates.length} existing candidates with tracking data`);
        // Create a map of existing tracking data by filename
        const trackingDataMap = new Map();
        existingCandidates.forEach(candidate => {
            if (candidate.tracking) {
                trackingDataMap.set(candidate.filename, candidate.tracking);
            }
        });
        // Process candidates one by one instead of bulk write to better handle errors
        const processedCandidates = [];
        const errors = [];
        for (const candidate of candidates) {
            try {
                // Skip candidates without required fields
                if (!candidate.filename || !candidate.matchAnalysis) {
                    console.warn(`Skipping invalid candidate data: ${JSON.stringify(candidate)}`);
                    continue;
                }
                // Ensure required fields exist
                const processedCandidate = {
                    filename: candidate.filename,
                    name: candidate.name || "Unknown",
                    email: candidate.email || "unknown@example.com",
                    matchAnalysis: {
                        matchPercentage: candidate.matchAnalysis.matchPercentage || 0,
                        matchingSkills: candidate.matchAnalysis.matchingSkills || [],
                        missingRequirements: candidate.matchAnalysis.missingRequirements || [],
                        experienceMatch: candidate.matchAnalysis.experienceMatch || false,
                        educationMatch: candidate.matchAnalysis.educationMatch || false,
                        overallAssessment: candidate.matchAnalysis.overallAssessment || ""
                    },
                    analysis: {
                        key_skills: ((_b = candidate.analysis) === null || _b === void 0 ? void 0 : _b.key_skills) || [],
                        education_details: ((_c = candidate.analysis) === null || _c === void 0 ? void 0 : _c.education_details) || [],
                        work_experience_details: ((_d = candidate.analysis) === null || _d === void 0 ? void 0 : _d.work_experience_details) || []
                    },
                    jobId: new mongoose_1.default.Types.ObjectId(id),
                    userId: candidate.userId || userId,
                    userEmail: candidate.userEmail || ((_e = req.user) === null || _e === void 0 ? void 0 : _e.email) || "unknown@example.com"
                };
                // Add existing tracking data if it exists
                const existingTracking = trackingDataMap.get(candidate.filename);
                if (existingTracking) {
                    processedCandidate.tracking = existingTracking;
                }
                else {
                    processedCandidate.tracking = {
                        status: 'pending',
                        statusHistory: [{
                                status: 'pending',
                                timestamp: new Date(),
                                updatedBy: ((_f = req.user) === null || _f === void 0 ? void 0 : _f.email) || 'system'
                            }],
                        lastUpdated: new Date(),
                        updatedBy: ((_g = req.user) === null || _g === void 0 ? void 0 : _g.email) || 'system'
                    };
                }
                // Try to find existing candidate
                const existingCandidate = await JobCandidate_1.default.findOne({
                    jobId: id,
                    filename: candidate.filename
                });
                if (existingCandidate) {
                    // Update existing candidate
                    await JobCandidate_1.default.updateOne({ _id: existingCandidate._id }, {
                        $set: {
                            ...processedCandidate,
                            updated_at: new Date()
                        }
                    });
                }
                else {
                    // Create new candidate
                    const newCandidate = new JobCandidate_1.default({
                        ...processedCandidate,
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                    await newCandidate.save();
                }
                processedCandidates.push(processedCandidate);
            }
            catch (err) {
                console.error(`Error processing candidate ${candidate.filename}:`, err);
                errors.push({
                    filename: candidate.filename,
                    error: err instanceof Error ? err.message : String(err)
                });
            }
        }
        res.status(200).json({
            message: 'Candidates saved successfully',
            savedCount: processedCandidates.length,
            totalCount: candidates.length,
            errors: errors.length > 0 ? errors : undefined
        });
    }
    catch (error) {
        console.error('Error saving job candidates:', error);
        res.status(500).json({
            error: 'Failed to save job candidates',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.saveJobCandidates = saveJobCandidates;
// Update candidate status
const updateCandidateStatus = async (req, res) => {
    var _a, _b, _c, _d;
    try {
        const { id, candidateId } = req.params;
        const { status, ...additionalData } = req.body;
        // Authenticate user
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Find job and candidate
        const job = await Job_1.default.findById(id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        // Find the candidate by filename
        const candidate = await JobCandidate_1.default.findOne({
            jobId: id,
            filename: candidateId
        });
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        // Initialize tracking if it doesn't exist
        if (!candidate.tracking) {
            candidate.tracking = {
                status: 'new',
                statusHistory: [],
                lastUpdated: new Date(),
                updatedBy: ((_b = req.user) === null || _b === void 0 ? void 0 : _b.email) || 'system'
            };
        }
        // Get previous status for history
        const previousStatus = candidate.tracking.status;
        // Update tracking info
        candidate.tracking.status = status;
        candidate.tracking.lastUpdated = new Date();
        candidate.tracking.updatedBy = ((_c = req.user) === null || _c === void 0 ? void 0 : _c.email) || 'system';
        // Add status history entry
        if (!candidate.tracking.statusHistory) {
            candidate.tracking.statusHistory = [];
        }
        candidate.tracking.statusHistory.push({
            status,
            timestamp: new Date(),
            updatedBy: ((_d = req.user) === null || _d === void 0 ? void 0 : _d.email) || 'system'
        });
        // Process additional data
        if (status === 'rate_confirmed' && additionalData.rateConfirmed) {
            candidate.tracking.rateConfirmed = additionalData.rateConfirmed;
        }
        if (status === 'interview_scheduled' && additionalData.interviewDate) {
            candidate.tracking.interviewDate = additionalData.interviewDate;
        }
        if (status === 'contacted' && additionalData.contactedDate) {
            candidate.tracking.contactedDate = additionalData.contactedDate;
        }
        if (additionalData.notes) {
            candidate.tracking.notes = additionalData.notes;
        }
        // Save updated candidate
        await candidate.save();
        // Return the updated candidate with tracking info
        res.status(200).json({
            message: 'Candidate status updated successfully',
            candidate: candidate.toObject(),
            tracking: candidate.tracking
        });
    }
    catch (error) {
        console.error('Error updating candidate status:', error);
        res.status(500).json({ message: 'Error updating candidate status', error: error.message });
    }
};
exports.updateCandidateStatus = updateCandidateStatus;
// Get all resumes for job matching
const getAllResumesForMatching = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // First try to get all resumes directly 
        try {
            const allResumes = await Resume_1.default.find({});
            if (allResumes && allResumes.length > 0) {
                console.log(`Found ${allResumes.length} total resumes`);
                // Transform the resumes to the expected format
                const transformedResumes = allResumes.map(resume => {
                    const user_id = resume.user_id || userId;
                    return {
                        filename: resume.filename,
                        analysis: resume.analysis || {
                            name: "Unknown",
                            email: "unknown@example.com",
                            key_skills: [],
                            education_details: [],
                            work_experience_details: []
                        },
                        userId: user_id,
                        userEmail: resume.user_email || "unknown@example.com"
                    };
                });
                return res.status(200).json(transformedResumes);
            }
        }
        catch (directError) {
            console.warn('Error fetching resumes directly, falling back to user-by-user approach:', directError);
        }
        // Fall back to getting users first and then their resumes
        const users = await User_1.default.find();
        const allResumes = [];
        // Collect resumes from all users
        for (const user of users) {
            try {
                const userResumes = await Resume_1.default.find({ user_id: user.uid });
                // Transform the resumes to the expected format
                const transformedResumes = userResumes.map(resume => ({
                    filename: resume.filename,
                    analysis: resume.analysis || {
                        name: "Unknown",
                        email: "unknown@example.com",
                        key_skills: [],
                        education_details: [],
                        work_experience_details: []
                    },
                    userId: user.uid,
                    userEmail: user.email || "unknown@example.com"
                }));
                allResumes.push(...transformedResumes);
            }
            catch (error) {
                console.warn(`Error fetching resumes for user ${user.uid}:`, error);
            }
        }
        res.status(200).json(allResumes);
    }
    catch (error) {
        console.error('Error fetching all resumes:', error);
        res.status(500).json({ error: 'Failed to fetch all resumes' });
    }
};
exports.getAllResumesForMatching = getAllResumesForMatching;
// Assign recruiters to a job
const assignRecruiters = async (req, res) => {
    var _a, _b, _c;
    try {
        const { id } = req.params;
        const { recruiterIds } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Find the job
        const job = await Job_1.default.findById(id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        // Check if user is admin or the creator of the job
        const isAdmin = userRole === 'admin';
        const isCreator = ((_c = job.metadata) === null || _c === void 0 ? void 0 : _c.created_by_id) === userId;
        if (!isAdmin && !isCreator) {
            return res.status(403).json({ error: 'Not authorized to assign recruiters to this job' });
        }
        // Update job with assigned recruiters
        const updatedJob = await Job_1.default.findByIdAndUpdate(id, { assigned_recruiters: recruiterIds }, { new: true });
        res.status(200).json(updatedJob);
    }
    catch (error) {
        console.error('Error assigning recruiters:', error);
        res.status(500).json({ error: 'Failed to assign recruiters' });
    }
};
exports.assignRecruiters = assignRecruiters;
// Check for new resumes since last analysis
const checkForNewResumes = async (req, res) => {
    var _a;
    try {
        const { id } = req.params; // Job ID
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Find the job to ensure it exists
        const job = await Job_1.default.findById(id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        // Get all analyzed candidates for this job
        const analyzedCandidates = await JobCandidate_1.default.find({ jobId: id });
        const analyzedFilenames = analyzedCandidates.map(c => c.filename);
        // Get all available resumes
        const allResumes = await Resume_1.default.find({});
        const allFilenames = allResumes.map(r => r.filename);
        // Find filenames that are in allResumes but not in analyzedCandidates
        const newFilenames = allFilenames.filter(filename => !analyzedFilenames.includes(filename));
        res.status(200).json({
            hasNewResumes: newFilenames.length > 0,
            newResumeCount: newFilenames.length,
            analyzedCount: analyzedFilenames.length,
            totalResumeCount: allFilenames.length
        });
    }
    catch (error) {
        console.error('Error checking for new resumes:', error);
        res.status(500).json({ error: 'Failed to check for new resumes' });
    }
};
exports.checkForNewResumes = checkForNewResumes;
