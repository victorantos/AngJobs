using System;
using AngJobs.Models;

namespace AngJobs.ViewModels;

public class JobViewModel : ViewModelBase
{
    private readonly Job _job;

    public JobViewModel(Job job)
    {
        _job = job;
    }

    public string Title => _job.Title.Replace("ASK HN: Who is hiring?", string.Empty, StringComparison.OrdinalIgnoreCase).Trim().Trim('(', ')');

    public string Description => _job.Description;
}