using AngJobs.Models;

namespace AngJobs.ViewModels;

public class JobViewModel : ViewModelBase
{
    private readonly Job _job;

    public JobViewModel(Job job)
    {
        _job = job;
    }

    public string Title => _job.Title;
    public string Description => _job.Description;
}