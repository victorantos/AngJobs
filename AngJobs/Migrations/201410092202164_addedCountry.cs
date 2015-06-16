namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedCountry : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.JobPosts", "Country", c => c.String());
        }
        
        public override void Down()
        {
            DropColumn("dbo.JobPosts", "Country");
        }
    }
}
