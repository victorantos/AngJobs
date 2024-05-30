using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Markup.Xaml;
using Avalonia.Media;

namespace AngJobs.Views;

public partial class JobView : UserControl
{
    public JobView()
    {
        InitializeComponent();
    }

    private void InputElement_OnPointerEntered(object? sender, PointerEventArgs e)
    {
        (sender as Border).Background = Brushes.LightBlue;
    }

    private void InputElement_OnPointerExited(object? sender, PointerEventArgs e)
    {
        (sender as Border).Background = Brushes.WhiteSmoke;
    }
}