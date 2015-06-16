namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedFields4 : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.JobPosts", "VisasPossible", c => c.String(maxLength: 32));
            AddColumn("dbo.JobPosts", "Intern", c => c.Boolean());
            AddColumn("dbo.JobPosts", "Lat", c => c.Decimal(precision: 18, scale: 2));
            AddColumn("dbo.JobPosts", "Lon", c => c.Decimal(precision: 18, scale: 2));
        }
        
        public override void Down()
        {
            DropColumn("dbo.JobPosts", "Lon");
            DropColumn("dbo.JobPosts", "Lat");
            DropColumn("dbo.JobPosts", "Intern");
            DropColumn("dbo.JobPosts", "VisasPossible");
        }
    }
}
