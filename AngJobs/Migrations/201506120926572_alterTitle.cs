namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class alterTitle : DbMigration
    {
        public override void Up()
        {
            AlterColumn("dbo.JobPosts", "JobTitle", c => c.String(maxLength: 256));
        }
        
        public override void Down()
        {
            AlterColumn("dbo.JobPosts", "JobTitle", c => c.String());
        }
    }
}
