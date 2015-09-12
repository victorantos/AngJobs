namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedSubscriberEmailReq : DbMigration
    {
        public override void Up()
        {
            AlterColumn("dbo.Subscribers", "Email", c => c.String(nullable: false, maxLength: 256));
        }
        
        public override void Down()
        {
            AlterColumn("dbo.Subscribers", "Email", c => c.String(maxLength: 256));
        }
    }
}
