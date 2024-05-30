using System.Windows.Input;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Interactivity;

namespace Angjobs.Helpers
{

    public class PointerEvents
    {
        public static readonly AttachedProperty<ICommand> PointerEnterCommandProperty =
            AvaloniaProperty.RegisterAttached<PointerEvents, Control, ICommand>("PointerEnterCommand");

        public static readonly AttachedProperty<ICommand> PointerLeaveCommandProperty =
            AvaloniaProperty.RegisterAttached<PointerEvents, Control, ICommand>("PointerLeaveCommand");

        public static ICommand GetPointerEnterCommand(Control control)
        {
            return control.GetValue(PointerEnterCommandProperty);
        }

        public static void SetPointerEnterCommand(Control control, ICommand value)
        {
            control.SetValue(PointerEnterCommandProperty, value);
        }

        public static ICommand GetPointerLeaveCommand(Control control)
        {
            return control.GetValue(PointerLeaveCommandProperty);
        }

        public static void SetPointerLeaveCommand(Control control, ICommand value)
        {
            control.SetValue(PointerLeaveCommandProperty, value);
        }

        private static void OnPointerEnterCommandChanged(Control control, ICommand command)
        {
            control.PointerEntered += (sender, e) => ExecuteCommand(control, command);
        }

        private static void OnPointerLeaveCommandChanged(Control control, ICommand command)
        {
            control.PointerExited += (sender, e) => ExecuteCommand(control, command);
        }

        private static void ExecuteCommand(Control control, ICommand command)
        {
            if (command?.CanExecute(control.DataContext) == true)
            {
                command.Execute(control.DataContext);
            }
        }
    }
}
