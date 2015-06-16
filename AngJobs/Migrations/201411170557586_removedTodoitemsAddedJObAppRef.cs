namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class removedTodoitemsAddedJObAppRef : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.todoItems", "User_Id", "dbo.Users");
            DropIndex("dbo.todoItems", new[] { "User_Id" });
            DropTable("dbo.todoItems");
        }
        
        public override void Down()
        {
            CreateTable(
                "dbo.todoItems",
                c => new
                    {
                        id = c.Int(nullable: false, identity: true),
                        task = c.String(),
                        completed = c.Boolean(nullable: false),
                        User_Id = c.String(maxLength: 128),
                    })
                .PrimaryKey(t => t.id);
            
            CreateIndex("dbo.todoItems", "User_Id");
            AddForeignKey("dbo.todoItems", "User_Id", "dbo.Users", "Id");
        }
    }
}
