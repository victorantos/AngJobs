namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedStripe : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Users", "PaymentSystemId", c => c.String());
        }
        
        public override void Down()
        {
            DropColumn("dbo.Users", "PaymentSystemId");
        }
    }
}
