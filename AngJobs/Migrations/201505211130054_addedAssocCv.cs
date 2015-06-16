namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedAssocCv : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.JobApplications", "CV_Id", c => c.Int());
            CreateIndex("dbo.JobApplications", "CV_Id");
            AddForeignKey("dbo.JobApplications", "CV_Id", "dbo.CVs", "Id");
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.JobApplications", "CV_Id", "dbo.CVs");
            DropIndex("dbo.JobApplications", new[] { "CV_Id" });
            DropColumn("dbo.JobApplications", "CV_Id");
        }
    }
}
