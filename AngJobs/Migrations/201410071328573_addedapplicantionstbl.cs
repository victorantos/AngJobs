namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedapplicantionstbl : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.JobApplications",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        ApplicantEmail = c.String(),
                        ApplicantSkills = c.String(),
                        ApplicantExperience = c.String(),
                        ApplicantMessage = c.String(),
                        IsDeleted = c.Boolean(),
                        CreatedBy = c.String(),
                        Ip = c.String(),
                        DateCreated = c.DateTime(nullable: false),
                        DateSent = c.DateTime(),
                        JobPost_Id = c.Int(),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.JobPosts", t => t.JobPost_Id)
                .Index(t => t.JobPost_Id);
            
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.JobApplications", "JobPost_Id", "dbo.JobPosts");
            DropIndex("dbo.JobApplications", new[] { "JobPost_Id" });
            DropTable("dbo.JobApplications");
        }
    }
}
