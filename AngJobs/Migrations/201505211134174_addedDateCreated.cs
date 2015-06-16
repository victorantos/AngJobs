namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedDateCreated : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.CVs", "DateCreated", c => c.DateTime(nullable: false));
        }
        
        public override void Down()
        {
            DropColumn("dbo.CVs", "DateCreated");
        }
    }
}
