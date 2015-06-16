namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedownerforjobpost : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.JobPosts", "Owner_Id", c => c.String(maxLength: 128));
            CreateIndex("dbo.JobPosts", "Owner_Id");
            AddForeignKey("dbo.JobPosts", "Owner_Id", "dbo.Users", "Id");
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.JobPosts", "Owner_Id", "dbo.Users");
            DropIndex("dbo.JobPosts", new[] { "Owner_Id" });
            DropColumn("dbo.JobPosts", "Owner_Id");
        }
    }
}
