namespace AngJobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedREcruiters : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.Recruiters",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Website = c.String(maxLength: 256),
                        DateAdded = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
        }
        
        public override void Down()
        {
            DropTable("dbo.Recruiters");
        }
    }
}
