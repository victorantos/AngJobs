namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedStripe2 : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.SubscriptionPlans",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Title = c.String(nullable: false),
                        PaymentSystemId = c.String(),
                        Note = c.String(),
                        Description = c.String(),
                        TrialDays = c.Int(nullable: false),
                        Price = c.Single(nullable: false),
                        State = c.Int(nullable: false),
                        CreatedDateUtc = c.DateTime(),
                        IsSoftDeleted = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.Subscriptions",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        ActiveUntil = c.DateTime(),
                        Notes = c.String(),
                        PaymentSystemId = c.String(),
                        PlanId = c.Int(nullable: false),
                        CreatedDateUtc = c.DateTime(),
                        IsSoftDeleted = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.SubscriptionPlans", t => t.PlanId, cascadeDelete: true)
                .Index(t => t.PlanId);
            
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.Subscriptions", "PlanId", "dbo.SubscriptionPlans");
            DropIndex("dbo.Subscriptions", new[] { "PlanId" });
            DropTable("dbo.Subscriptions");
            DropTable("dbo.SubscriptionPlans");
        }
    }
}
