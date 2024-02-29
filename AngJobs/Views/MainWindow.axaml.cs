using System.Threading.Tasks;
using AngJobs.ViewModels;
using Avalonia.Controls;
using Avalonia.ReactiveUI;
using ReactiveUI;

namespace AngJobs.Views;

public partial class MainWindow : ReactiveWindow<MainViewModel>
{
    public MainWindow()
    {
        InitializeComponent();
        
        this.WhenActivated(action => 
            action(ViewModel!.ShowDialog.RegisterHandler(DoShowDialogAsync)));

        InitializeDelayedActions();
    }
    private async Task DoShowDialogAsync(InteractionContext<JobsViewModel,
        JobViewModel?> interaction)
    {
        var dialog = new JobsWindow();
        dialog.DataContext = interaction.Input;

        var result = await dialog.ShowDialog<JobViewModel?>(this);
        interaction.SetOutput(result);
    }
    private async void InitializeDelayedActions()
    {
        // TODO check if delayed action is required
        //  check for any saved jobs 
        
        await Task.Delay(1000); // Delay for 1 second

        // Execute your method after 1 second
        OpenChildWindow();
    }

    private  void OpenChildWindow()
    { 
        // Logic to open the child window
        var childWindow = new JobsWindow();
        childWindow.DataContext = new JobsViewModel();
        childWindow.ShowDialog<JobViewModel?>(this);
    }
}