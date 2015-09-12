namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedSubscriberIp : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Subscribers", "Ip", c => c.String(maxLength: 32));
        }
        
        public override void Down()
        {
            DropColumn("dbo.Subscribers", "Ip");
        }
    }
}
