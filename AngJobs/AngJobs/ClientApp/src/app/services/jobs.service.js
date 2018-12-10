"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var job_model_1 = require("../jobs/job.model");
var JobsService = /** @class */ (function () {
    function JobsService() {
        this.jobs = [];
        this.resumes = [];
        this.jobApplications = [];
        //some default jobs
        var data = [
            new job_model_1.Job('C# Developer - ASP.NET/JavaScript/SQL Server/Python', "C# Developer - ASP.NET/JavaScript/SQL Server/Python - This is a long term contract opportunity for an experienced .NET Developer to join a global financial services organisation.\n                  Your experience / skills:\n\n              C# Development experience - Front End and Back End development experience\n                  JavaScript and MS SQL Server 2016 know - how\n                  Python is highly desirable\n                  Good knowledge of object - oriented and functional programming paradigms, experience in Tableau is a plus\n                  Good understanding of financial instruments and transactions, especially related to asset management is an advantage\n                  Languages: fluent English both written and spoken\n                  Your tasks:\n\n              Ensuring interfacing with an external calculation application and storing the data in an existing internal database\n              Fulfilling export of data into a new star - schema based database\n              Designing and operating quality checks on the received data, including time series analysis\n              Performing.NET - based GUIs to business users to visualise data and configure calculation settings\n              Processing incoming data from various sources, including databases, Excel files, PDFs, csv and Bloomberg\n              Applying calculation transformations in Python to the data and producing aggregated reporting results", 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwp1q11eLnFrde0uXFyCWGPmUkZkhT7wNmln7-hjjBP5hoHRg8bA', 'Zurich, Switzerland'),
            new job_model_1.Job('junior dev C#', 'london based job', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwp1q11eLnFrde0uXFyCWGPmUkZkhT7wNmln7-hjjBP5hoHRg8bA', ''),
            new job_model_1.Job('software dev C#', 'london based job', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHaJIZ29RnvxK04qT_fadhJQ7cW7n1KcemPiuCTx365SiYdkdAsw', '')
        ];
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var i = data_1[_i];
            this.jobs.push(i);
        }
    }
    JobsService.prototype.getJobs = function () {
        return this.jobs;
    };
    JobsService.prototype.getResumes = function () {
        return this.resumes;
    };
    JobsService.prototype.getJobApplications = function () {
        return this.jobApplications;
    };
    JobsService.prototype.addJob = function (job) {
        this.jobs.push(job);
        console.log("Jobs", this.jobs);
    };
    JobsService.prototype.addResume = function (resume) {
        this.resumes.push(resume);
        console.log("Resumes", this.resumes);
    };
    JobsService.prototype.addJobApplication = function (jobApplication) {
        this.jobApplications.push(jobApplication);
        console.log("jobApplication", this.jobApplications);
    };
    JobsService.prototype.generateResumeName = function () {
        var date = new Date(), locale = "en-uk", month = date.toLocaleString(locale, {
            month: "short"
        }), year = date.getFullYear(), i = this.resumes.length;
        var title = 'resume-' + month + '-' + year + (i > 0 ? '-(' + i + ')' : '');
        return title;
    };
    return JobsService;
}());
exports.JobsService = JobsService;
//# sourceMappingURL=jobs.service.js.map