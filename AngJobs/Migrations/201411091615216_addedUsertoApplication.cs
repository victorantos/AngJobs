namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedUsertoApplication : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.JobApplications", "User_Id", c => c.String(maxLength: 128));
            CreateIndex("dbo.JobApplications", "User_Id");
            AddForeignKey("dbo.JobApplications", "User_Id", "dbo.Users", "Id");
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.JobApplications", "User_Id", "dbo.Users");
            DropIndex("dbo.JobApplications", new[] { "User_Id" });
            DropColumn("dbo.JobApplications", "User_Id");
        }
    }
}
