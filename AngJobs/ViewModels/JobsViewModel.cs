using System;
using System.Collections.ObjectModel;
using System.Reactive.Linq;
using AngJobs.Models;
using ReactiveUI;

namespace AngJobs.ViewModels;

public class JobsViewModel: ViewModelBase
{
    private string? _searchText;
    private bool _isBusy;
    private JobViewModel? _selectedJob;

    public JobsViewModel()
    {
        this.WhenAnyValue(x => x.SearchText)
            .Throttle(TimeSpan.FromMilliseconds(400))
            .ObserveOn(RxApp.MainThreadScheduler)
            .Subscribe(DoSearch!);
    }

    private async void DoSearch(string s)
    {
        IsBusy = true;
        SearchResults.Clear();

        if (!string.IsNullOrWhiteSpace(s))
        {
            var jobs = Job.SearchAsync(s);
            foreach (var job in jobs)
            {
                var vm = new JobViewModel(job);
                SearchResults.Add(vm);
            }
        }

        IsBusy = false;
    }
    public ObservableCollection<JobViewModel> SearchResults { get; } = new();

    public JobViewModel? SelectedJob
    {
        get => _selectedJob;
        set => this.RaiseAndSetIfChanged(ref _selectedJob, value);
    }
    public string? SearchText
    {
        get => _searchText;
        set => this.RaiseAndSetIfChanged(ref _searchText, value);
    }

    public bool IsBusy
    {
        get => _isBusy;
        set => this.RaiseAndSetIfChanged(ref _isBusy, value);
    }
}