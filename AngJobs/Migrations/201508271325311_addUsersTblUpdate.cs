namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addUsersTblUpdate : DbMigration
    {
        public override void Up()
        {
            AlterColumn("dbo.Users", "Email", c => c.String(maxLength: 256));
            AlterColumn("dbo.Users", "UserName", c => c.String(nullable: false, maxLength: 256));
            CreateIndex("dbo.Users", "UserName", unique: true, name: "UserNameIndex");
        }
        
        public override void Down()
        {
            DropIndex("dbo.Users", "UserNameIndex");
            AlterColumn("dbo.Users", "UserName", c => c.String());
            AlterColumn("dbo.Users", "Email", c => c.String());
        }
    }
}
