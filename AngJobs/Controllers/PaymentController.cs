using Angjobs.Models;
using System;
using System.Collections.Generic;
using Microsoft.AspNet.Identity.Owin;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using System.Threading.Tasks;
using System.Collections.Specialized;
using System.Web;
using System.Web.Http.Description;
using Stripe;
using System.Configuration;

namespace Angjobs.Controllers
{
    [ApiExplorerSettings(IgnoreApi = true)]
    public class PaymentController : ApiBaseController
    {
        [HttpPost]
        public async Task<HttpResponseMessage> SaveCustomer(StripeChargeModel model)
        {
            string chargeId = null;

            if (IsOneoffPay(model.Amount))
            {
                chargeId = await ProcessPayment(model);
            }
            else if (IsSubscriptionPay(model.Amount))
            {
                chargeId = await ProcessSubscription(model);
            }
            else{
               return Request.CreateResponse<string>(HttpStatusCode.BadRequest, "Amount not accepted."); 
            }

            // You should do something with the chargeId --> Persist it maybe?
            return Request.CreateResponse<object>(HttpStatusCode.OK, new { chargeId = chargeId, validPay = true }); 
        }

        private bool IsSubscriptionPay(int? amount)
        {
            return amount == 399;
        }

        private bool IsOneoffPay(int? amount)
        {
            return amount == 1900;
        }

        private async Task<string> ProcessSubscription(StripeChargeModel model)
        {
            //TODO
            if (model.Amount == 0)
            {
                model.Amount = 399;
            }

            var planId = "Up100PerMo";
            var secretKey = ConfigurationManager.AppSettings["StripeApiKey"];
            model.Card.TokenId = model.Id;

            return await Task.Run(() =>
            {
                var stripeCustomerCreateOptions = new StripeCustomerCreateOptions
                {
                    Email = model.Email,
                    PlanId = planId,
                    Card = model.Card,
                    Description = "Charged £3.99 for monthly up to 100",
                };
                var customerService = new StripeCustomerService(secretKey);
                var stripeCustomer = customerService.Create(stripeCustomerCreateOptions);

                return stripeCustomer.Id;
            });
        }

        private async Task<string> ProcessPayment(StripeChargeModel model)
        {
            //TODO
            if(model.Amount == 0)
            {
                model.Amount = 1900;
            }
            model.Card.TokenId = model.Id;
            return await Task.Run(() =>
            {
                var myCharge = new StripeChargeCreateOptions
                {
                    // convert the amount of £12.50 to pennies i.e. 1250
                    Amount = model.Amount, //in pence
                    Currency = "gbp",
                    Description = "Charged £19 one-off up to 1000",
                    Card = model.Card ,
                    ReceiptEmail = model.Email
                   // TokenId = model.Token
                };

                var chargeService = new StripeChargeService(ConfigurationManager.AppSettings["StripeApiKey"]);
                var stripeCharge = chargeService.Create(myCharge);

                return stripeCharge.Id;
            });
        }
       
    }
}
