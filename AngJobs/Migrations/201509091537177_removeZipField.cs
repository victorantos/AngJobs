namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class removeZipField : DbMigration
    {
        public override void Up()
        {
            DropColumn("dbo.Users", "zip");
        }
        
        public override void Down()
        {
            AddColumn("dbo.Users", "zip", c => c.String());
        }
    }
}
