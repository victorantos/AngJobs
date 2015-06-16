namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class removedJobpostid : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.JobApplications", "JobPostId", "dbo.JobPosts");
            DropIndex("dbo.JobApplications", new[] { "JobPostId" });
            RenameColumn(table: "dbo.JobApplications", name: "JobPostId", newName: "JobPost_Id");
            AlterColumn("dbo.JobApplications", "JobPost_Id", c => c.Int());
            CreateIndex("dbo.JobApplications", "JobPost_Id");
            AddForeignKey("dbo.JobApplications", "JobPost_Id", "dbo.JobPosts", "Id");
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.JobApplications", "JobPost_Id", "dbo.JobPosts");
            DropIndex("dbo.JobApplications", new[] { "JobPost_Id" });
            AlterColumn("dbo.JobApplications", "JobPost_Id", c => c.Int(nullable: false));
            RenameColumn(table: "dbo.JobApplications", name: "JobPost_Id", newName: "JobPostId");
            CreateIndex("dbo.JobApplications", "JobPostId");
            AddForeignKey("dbo.JobApplications", "JobPostId", "dbo.JobPosts", "Id", cascadeDelete: true);
        }
    }
}
