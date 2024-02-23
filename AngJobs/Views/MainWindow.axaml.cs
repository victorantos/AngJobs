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
    }
    private async Task DoShowDialogAsync(InteractionContext<JobsViewModel,
        JobViewModel?> interaction)
    {
        var dialog = new JobsWindow();
        dialog.DataContext = interaction.Input;

        var result = await dialog.ShowDialog<JobViewModel?>(this);
        interaction.SetOutput(result);
    }
}