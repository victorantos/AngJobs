namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedcurrency : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.JobPosts", "Currency", c => c.Int(nullable: false));
        }
        
        public override void Down()
        {
            DropColumn("dbo.JobPosts", "Currency");
        }
    }
}
