namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class fixedjobPostId : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.JobApplications", "JobPost_Id", "dbo.JobPosts");
            DropIndex("dbo.JobApplications", new[] { "JobPost_Id" });
            RenameColumn(table: "dbo.JobApplications", name: "JobPost_Id", newName: "JobPostId");
            AlterColumn("dbo.JobApplications", "JobPostId", c => c.Int(nullable: false));
            CreateIndex("dbo.JobApplications", "JobPostId");
            AddForeignKey("dbo.JobApplications", "JobPostId", "dbo.JobPosts", "Id", cascadeDelete: true);
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.JobApplications", "JobPostId", "dbo.JobPosts");
            DropIndex("dbo.JobApplications", new[] { "JobPostId" });
            AlterColumn("dbo.JobApplications", "JobPostId", c => c.Int());
            RenameColumn(table: "dbo.JobApplications", name: "JobPostId", newName: "JobPost_Id");
            CreateIndex("dbo.JobApplications", "JobPost_Id");
            AddForeignKey("dbo.JobApplications", "JobPost_Id", "dbo.JobPosts", "Id");
        }
    }
}
