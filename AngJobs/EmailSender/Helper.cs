using FluentEmail;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using PreMailer.Net;
using System.Net.Mime;

namespace Angjobs
{
    public static class Helper
    {

        public static Stream ToStream(this string str)
        {
            MemoryStream stream = new MemoryStream();
            StreamWriter writer = new StreamWriter(stream);
            writer.Write(str);
            writer.Flush();
            stream.Position = 0;
            return stream;
        }

        const string toEmail = "bob@test.com";
        const string fromEmail = "johno@test.com";
        const string subject = "[AngJobs] ";


        public static void NotifyRecruiter(Models.JobApplication entity, string cvFolder)
        {
            // Save in Mails folder for sending later
            
            //E:\Work\AngJobs.com\src\Angjobs\Angjobs\Assets\bootstrap\css\bootstrap-theme.css
            //E:\Work\AngJobs.com\src\Angjobs\Angjobs\Assets\bootstrap\css\bootstrap.min.css
            //E:\Work\AngJobs.com\src\Angjobs\Angjobs\Assets\styles\styles.css
            var template = new StringBuilder();
            template.AppendLine(@"<html>");
            template.AppendLine(@"<style>");

                template.AppendLine(@"     .bg-light {                  ");
                template.AppendLine(@"    color: #58666e;               ");
                template.AppendLine(@"    background-color: #edf1f2;    ");
                template.AppendLine(@"    }                             ");
                template.AppendLine(@"    .label {                      ");
                template.AppendLine(@"        display: inline;          ");
                template.AppendLine(@"        padding: .2em .6em .3em;  ");
                template.AppendLine(@"        font-size: 75%;           ");
                template.AppendLine(@"        font-weight: bold;        ");
                template.AppendLine(@"        line-height: 1;           ");
                template.AppendLine(@"        color: #fff;              ");
                template.AppendLine(@"        text-align: center;       ");
                template.AppendLine(@"        white-space: nowrap;      ");
                template.AppendLine(@"    }                             ");
                template.AppendLine(@"    dl {                          ");
                template.AppendLine(@"        margin-top: 0;            ");
                template.AppendLine(@"        margin-bottom: 20px;      ");
                template.AppendLine(@"    }                             ");
                template.AppendLine(@"    dt {                          ");
                template.AppendLine(@"      font-weight: bold;          ");
                template.AppendLine(@"    }                             ");
                template.AppendLine(@"    dt, dd {                      ");
                template.AppendLine(@"        line-height: 1.42857143;  ");
                template.AppendLine(@"    }                             ");
                template.AppendLine(@"    p {                             ");
                template.AppendLine(@"        margin: 0 0 10px;           ");
                template.AppendLine(@"    }                               ");

          
            template.AppendLine(    @"</style>");
            template.AppendLine(@"<body>");
            
            template.AppendLine("Hello @Model.Name,");
            template.AppendLine(@"<br/>");
            template.AppendLine(@"<br/>");
            template.AppendLine(@"@Model.Applicant applied for a <a href='@Model.JobLink' target='_blank'>job</a> you advertised recently.");

            if (!string.IsNullOrEmpty(entity.ApplicantMessage))
                template.AppendLine(@" Below is the candidate's resume:");
            template.AppendLine(@"<br/>");
            template.AppendLine(@"<br/>");
            template.Append(@entity.ApplicantMessage);

            template.AppendLine(@"</body>");
            template.AppendLine(@"</html>");

            string htmlBody = template.ToString();


            var result = PreMailer.Net.PreMailer.MoveCssInline(htmlBody);

            htmlBody = result.Html;

               // result.Html   

            string fromEmail = ParseEmail(entity.ApplicantEmail);
            if(!string.IsNullOrEmpty(fromEmail))
            {
                var message = new MailMessage() { IsBodyHtml = true };
                Attachment attachment = getAttachment(entity.CV, cvFolder);
                var attachments = new List<Attachment>();
                if (attachment != null)
                    attachments.Add(attachment);

                //TODO make sure there is a valid destination email
                string destEmail = entity.JobPost.JobEmail ?? "hello@angjobs.com";
                var email = new Email(fromEmail)
                    .To(destEmail)
                    .Subject(subject + entity.ApplicantEmail + "applied for " + entity.JobPost.JobTitle)
                    .UsingTemplate(htmlBody, new
                    {
                        Name = entity.JobPost.ContactName,
                        Applicant = entity.ApplicantEmail, // TODO Actually it includes the name as well
                        JobLink = "http://angjobs.com/#!/jobdetails/"+ entity.JobPost.Id
                    }, true)
                    .BodyAsHtml()
                    .ReplyTo(fromEmail)
                    .Attach(attachments);
                
                object fileAttachment = attachment;

                EnsureEmailFolderExists();
                email.SendAsync(SendCompletedEventHandler_NotifyRecruiter, fileAttachment);
            }
        }

        private static void EnsureEmailFolderExists()
        {
            //TODO put this in config file
            string mailFolderPath = @"C:\Mails";
            if(!Directory.Exists(mailFolderPath))
            {
                Directory.CreateDirectory(mailFolderPath);
            }
        }

        private static Attachment getAttachment(Models.CV cv, string cvFolder)
        {
           
            Attachment attachment = null;
            if (cv != null)
            {
                string attachmentFilename = Path.Combine(cvFolder, cv.Name);
                attachment = new Attachment(attachmentFilename, MediaTypeNames.Application.Octet);
                ContentDisposition disposition = attachment.ContentDisposition;
                disposition.CreationDate = File.GetCreationTime(attachmentFilename);
                disposition.ModificationDate = File.GetLastWriteTime(attachmentFilename);
                disposition.ReadDate = File.GetLastAccessTime(attachmentFilename);
                disposition.FileName = Path.GetFileName(attachmentFilename);
                disposition.Size = new FileInfo(attachmentFilename).Length;
                disposition.DispositionType = DispositionTypeNames.Attachment;
            }
            return attachment;
        }

        public static string ParseEmail(string text)
        {
            string email = null;
            var test = new Regex(@"\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,6}\b", RegexOptions.IgnoreCase);

            if (test.IsMatch(text))
                email = test.Match(text).Value;

            return email;
        }
        private static void SendCompletedEventHandler_NotifyRecruiter(object sender, System.ComponentModel.AsyncCompletedEventArgs e)
        {
            if(e.UserState!= null)
            {
                var fileAttachment = (Attachment)e.UserState;
                if (fileAttachment != null)
                    fileAttachment.Dispose();
            }

            if (e.Error != null)
            {
                // log error
                Debug.WriteLine("Error while sendin email:" + e.Error.Message);
            }
            else
            {
                // update jobapplication flag or not
                Debug.WriteLine("Send Completed. UserState:" + e.UserState);
            }
        }

        public static void NotifyAdmin(Models.JobApplication entity)
        {
            //TODO
            //throw new NotImplementedException();
        }
    }
}