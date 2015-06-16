namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class alterFieldSize : DbMigration
    {
        public override void Up()
        {
            AlterColumn("dbo.JobPosts", "JobType", c => c.String(maxLength: 64));
            AlterColumn("dbo.JobPosts", "JobDuration", c => c.String(maxLength: 256));
        }
        
        public override void Down()
        {
            AlterColumn("dbo.JobPosts", "JobDuration", c => c.String());
            AlterColumn("dbo.JobPosts", "JobType", c => c.String());
        }
    }
}
