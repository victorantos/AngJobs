namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedISDeleted : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.JobPosts", "IsDeleted", c => c.Boolean());
        }
        
        public override void Down()
        {
            DropColumn("dbo.JobPosts", "IsDeleted");
        }
    }
}
