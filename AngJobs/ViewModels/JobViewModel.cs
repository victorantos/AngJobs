using System;
using System.Windows.Input;
using AngJobs.Helpers;
using AngJobs.Models;
using Avalonia;
using Avalonia.Controls;

namespace AngJobs.ViewModels;

public class JobViewModel : ViewModelBase
{
    private string _foregroundColor = "#333333"; // Initial color
    
    private readonly Job _job;

    public JobViewModel(Job job)
    {
        _job = job;
    }

    public string Title => _job.Title.Replace("ASK HN: Who is hiring?", 
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque pharetra et tortor vel consectetur. Maecenas sed tellus a ipsum ultrices scelerisque eu vel nulla. Praesent iaculis nibh nisl, at mollis nulla scelerisque eu. Nulla vitae nunc eget augue dictum aliquam. Vestibulum pellentesque nibh sit amet justo condimentum, sit amet vehicula massa tincidunt. ", StringComparison.OrdinalIgnoreCase).Trim().Trim('(', ')');

    public string Description => _job.Description;
    
    public ICommand OnMouseEnter => new RelayCommand(ExecuteMouseEnter);
    public ICommand OnMouseLeave => new RelayCommand(ExecuteMouseLeave);

    private void ExecuteMouseEnter(object parameter)
    {
        // Handle mouse enter event (e.g., change text color)
       
            textBlock.Foreground = Brushes.DarkGray; // Change to your desired darker color
    
    }

    private void ExecuteMouseLeave(object parameter)
    {
        // Handle mouse leave event (e.g., reset text color)
    }
    
    // Method to change the foreground color
    public void ChangeForegroundColor()
    {
        // Access the control by its name and change its properties
        // if (Application.Current.JobsWindow.Find<TextBlock>("MyBorder") is Border border)
        // {
        //     border.Foreground = new SolidColorBrush(Color.Parse("#FF0000")); // Change to your desired color
        // }
    }

}