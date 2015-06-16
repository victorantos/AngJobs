namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedIshot : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.JobPosts", "IsHot", c => c.Boolean());
        }
        
        public override void Down()
        {
            DropColumn("dbo.JobPosts", "IsHot");
        }
    }
}
