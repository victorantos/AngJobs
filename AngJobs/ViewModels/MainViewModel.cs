using System.Reactive.Linq;
using System.Windows.Input;
using ReactiveUI;

namespace AngJobs.ViewModels;

public class MainViewModel : ViewModelBase
{

    public MainViewModel()
    {
        ShowDialog = new Interaction<JobsViewModel, JobViewModel?>();
        
        FindJobsCommand = ReactiveCommand.Create(async () =>
        {
            var jobs = new JobsViewModel();
            var result = await ShowDialog.Handle(jobs);
        });
    }
    public ICommand FindJobsCommand { get; }
    public Interaction<JobsViewModel, JobViewModel?> ShowDialog { get; }
    
#pragma warning disable CA1822 // Mark members as static
    public string Greeting => "Welcome to Avalonias!";
#pragma warning restore CA1822 // Mark members as static
}
