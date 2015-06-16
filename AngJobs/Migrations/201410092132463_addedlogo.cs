namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedlogo : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.JobPosts", "HiringCompanyLogo", c => c.String());
        }
        
        public override void Down()
        {
            DropColumn("dbo.JobPosts", "HiringCompanyLogo");
        }
    }
}
