using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http.ModelBinding;

namespace AngJobs.Models.Utility
{
    static public class ModelErrorChecker
    {
        //Created to remove duplicated error message generation when a bad model is passed to a service.  
        //This method recieves the ModelState, loops through all the erros, and builds them into a list.
        //An empty list means no errors.
        static public List<string> Check(ModelStateDictionary ModelState)
        {
            var modelStateErrors = ModelState.Values.ToList();
            List<string> errors = new List<string>();
            foreach (var s in modelStateErrors)
                foreach (var e in s.Errors)
                    if (e.ErrorMessage != null && e.ErrorMessage.Trim() != "")
                        errors.Add(e.ErrorMessage);

            return errors;
        }
    }
}