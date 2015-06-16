namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedGuid : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.CVs", "Guid", c => c.Guid(nullable: false));
        }
        
        public override void Down()
        {
            DropColumn("dbo.CVs", "Guid");
        }
    }
}
