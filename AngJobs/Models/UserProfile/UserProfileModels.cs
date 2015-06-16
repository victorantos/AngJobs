using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Angjobs.Models
{
    public class UserProfile
    {
        public string emailAddress { get; set; }
        public string firstName { get; set; }
        public string formattedName { get; set; }
        public string id { get; set; }
        public string lastName { get; set; }
        public string headline { get; set; }
        public Positions positions { get; set; }
        public Location location { get; set; }
        public string publicProfileUrl { get; set; }
    }

    public class Country
    {
        public string code { get; set; }
    }

    public class Location
    {
        public Country country { get; set; }
        public string name { get; set; }
    }

    public class Company
    {
        public int id { get; set; }
        public string name { get; set; }
    }

    public class EndDate
    {
        public int month { get; set; }
        public int year { get; set; }
    }

    public class StartDate
    {
        public int month { get; set; }
        public int year { get; set; }
    }

    public class Value
    {
        public Company company { get; set; }
        public EndDate endDate { get; set; }
        public int id { get; set; }
        public bool isCurrent { get; set; }
        public StartDate startDate { get; set; }
        public string summary { get; set; }
        public string title { get; set; }
    }

    public class Positions
    {
        public int _total { get; set; }
        public List<Value> values { get; set; }
    } 
}