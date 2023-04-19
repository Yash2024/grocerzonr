const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const Promise = require('bluebird');
  Promise.config({
    cancellation: true
  });
// Replace YOUR_TOKEN with your actual token
//SmartGrocering
// const bot = new TelegramBot('6123908860:AAH-7n75rNzXeG_J1m6TFSjTaREc7ZlfLbU', { polling: true });



//DummyGrocering
// const bot = new TelegramBot('6088469995:AAFBant4q0b3pEyjb8t8CeCZyGs2oUQPap4', { polling: true });

//grocerZone
const bot = new TelegramBot('6111647851:AAFfS7KMfxGUMh_uf_hbMFFuH5mpdkJA-PE', { polling: true });

mongoose.connect('mongodb+srv://node-shop:node-shop@cluster0.giegz.mongodb.net/Smart-Grocering?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Order = require('./models/orders');
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// const chatId=null;
// Handle the /start command
bot.onText(/\/start/, async (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome to SmartGrocering!');
  bot.sendMessage(msg.chat.id, 'Type "/Showmenu" to display the Grocery Menu');
  await delay(100);
  bot.sendMessage(msg.chat.id, 'Type "/Offers" to display the Active Offers');
}); 

bot.onText(/\/Offers/, (msg) => {
  const chatId=msg.chat.id;
  bot.sendMessage(chatId,'Get Free Delivery on orders of Rs500 and above')
})

const qty=[100,50,50,400,50,45,75,24,14,25,24,100];
const item=['Sugar','Salt','Moong Daal','Wheat Flour','Rice','DesiGhee','Toor Daal','Tata Tea','Red Label Tea','Oats','Beans','Mustard Oil'];
// const order=[0,0,0,0,0,0,0,0,0,0,0,0];
const cost=[25,24,85,60,55,455,96,100,105,45,82,135];
const unit=['kg','kg','kg','kg','kg','kg','kg','kg','kg','kg','kg','L']


bot.onText(/\/Showmenu/, (msg) => {
  const chatId = msg.chat.id;
    const menu = {
      reply_markup: {
        inline_keyboard: [
          [{ text: item[0]+"    "+cost[0]+'/'+unit[0], callback_data: 0 }],
          [{ text: item[1]+"    "+cost[1]+'/'+unit[1], callback_data: 1 }],
          [{ text: item[2]+"    "+cost[2]+'/'+unit[2], callback_data: 2 }],
          [{ text: item[3]+"    "+cost[3]+'/'+unit[3], callback_data: 3 }],
          [{ text: item[4]+"    "+cost[4]+'/'+unit[4], callback_data: 4 }],
          [{ text: item[5]+"    "+cost[5]+'/'+unit[5], callback_data: 5 }],
          [{ text: item[6]+"    "+cost[6]+'/'+unit[6], callback_data: 6 }],
          [{ text: item[7]+"    "+cost[7]+'/'+unit[7], callback_data: 7 }],
          [{ text: item[8]+"    "+cost[8]+'/'+unit[8], callback_data: 8 }],
          [{ text: item[9]+"    "+cost[9]+'/'+unit[9], callback_data: 9 }],
          [{ text: item[10]+"    "+cost[10]+'/'+unit[10], callback_data: 10 }],
          [{ text: item[11]+"    "+cost[11]+'/'+unit[11], callback_data: 11 }]
        ]
      }
    }
    bot.sendMessage(chatId, 'Choose an option:', menu);
  
}); 


let data = null;
bot.on('callback_query', async (query) => {
   const chatId = query.message.chat.id;
  data = Number(query.data);
  bot.sendMessage(chatId, 'Available ' + item[data] + ': ' + qty[data] + unit[data]);
  await delay(100);
  bot.sendMessage(chatId, 'Type "Add <quantity>" Quantity of ' + item[data] + ' you want in ' + unit[data]);
});



bot.onText(/Add (\d+)/, async (msg, match) => {
  if (data === null) {
    // return if no data is set yet
    return;
  }
  const x=data;
  const chatId=msg.chat.id;
  const orderlist=[0,0,0,0,0,0,0,0,0,0,0,0];
  const q = Number(match[1]);
  // console.log(data);
  if(q>qty[data])
  {
    bot.sendMessage(chatId, 'please Add below available quantity');
  }
  else
  {
    // console.log(x);
    orderlist[x] += q;
    qty[x] -= q;
    Order.find({chat_id: chatId})
    .then(doc=>{
      if(doc.length>=1)
      {
        doc[0].orderlist[x]+=q;
        // console.log(doc[0].orderlist[x]);
        doc[0].save().then().catch();
      }
      else
      {
        const ord = new Order({
          _id: new mongoose.Types.ObjectId(),
          chat_id: chatId,
          orderlist: orderlist
        })

        ord.save()
        .then()
        .catch(err=>{
          console.log('order not saved');
          console.log(err);
        })
      }

    })
    .catch(err=>{
      console.log('find error');
      console.log(err);
    })
    
    bot.sendMessage(chatId, 'Select another Item from the menu above\n or type "/Done" if you do not want to add any other item ');
    bot.sendMessage(chatId, 'If you want to delete any item from your order \n then type "Delete<space><itemname>" \n\nIf you want to cancel your entire order Type "/Cancel"');
  }
  
  // reset the data value to null to avoid executing the listener multiple times
  data = null;
});




bot.onText(/\/Done/, async (msg)=>{
  const chatId = msg.chat.id;
  let total=Number("0");
  bot.sendMessage(chatId, 'Your Ordered items are');
  await delay(1000);
  bot.sendMessage(chatId,"Item     Ordered Quantity     Cost");
  await delay(1000);
  Order.find({chat_id:chatId})
  .then(async doc=>{
    if(doc.length<1)
    {
      bot.sendMessage(chatId, 'You have not ordered any item to buy please select from menu by typing "/Showmenu"');
      await delay(1000);
    }
    else
    {
      const order=doc[0].orderlist;
      for(let i=0;i<12;i++)
      {
        if(order[i]!=0)
        {
          bot.sendMessage(chatId, item[i]+'      '+order[i]+unit[i]+'                 '+order[i]*cost[i]+'/-');
          total+=(order[i]*cost[i]);
          await delay(100);
        }
      }
      await delay(1000);
      if(total===0)
      {
        bot.sendMessage(chatId, 'You have not selected any item to buy please select from menu by typing "/Showmenu"');
        await delay(1000);
      }
      else
      {
        if(total>=500)
        {
          bot.sendMessage(chatId, 'Delivery Charges          0/-');
          await delay(1000);
        }
        else
        {
          bot.sendMessage(chatId, 'Delivery Charges          25/-');
          total+=25;
          await delay(1000);
        }
        bot.sendMessage(chatId, 'Total Bill          '+total);
        await delay(1000);
        
        bot.sendMessage(chatId, 'If you want to add another item then select it from above menu or type "/Showmenu" and then select it" \n\n If you want to delete any item from your order \n then type "Delete<space><itemname>" \n\n If you want to confirm your order write "Confirm<space><Delivery Address>" \n\n Type "/Cancel" to cancel your order AFTER CONFIRM YOU CANNOT CANCEL');
        await delay(1000);
      }
    }
  })
  .catch(err=>{
    console.log('Error at time of done');
    console.log(err);
  })
  
  
})


bot.onText(/Delete (.+)/, async (msg,match)=>{
  const chatId = msg.chat.id;
    const del=match[1];
    Order.find({chat_id:chatId})
    .then(async doc=>{
      if(doc.length<1)
      {
        bot.sendMessage(chatId, 'You have not ordered any item to buy please select from menu by typing "/Showmenu"');
        await delay(1000);
      }
      else
      {
        let x=null;
        for(let i=0;i<12;i++)
        {
            if(item[i]===del&&doc[0].orderlist[i]>0)
            {
              qty[i]+=doc[0].orderlist[i];
              doc[0].orderlist[i]=0;
              doc[0].save().then().catch();
              x=1;
              break;
            }
        }
        if(x==null)
        {
          bot.sendMessage(chatId,'No such Item exists');
        }
        else
        {
          bot.sendMessage(chatId,'Item Deleted Successfully \n Type "Done" to view your bill \n\n If you want to cancel your entire order Type "/Cancel"');
        }
      }
    })
    
    
})


bot.onText(/Confirm ([A-Za-z]+)/, async (msg,match)=>{
  const chatId = msg.chat.id;
   const address=msg.text.slice(8);

   if(address==="")
   {
    bot.sendMessage(chatId,'Please write "Confirm<space><Delivery Address>"');
   }
   else
   {

    let placeorder="";
    // const chatId = msg.chat.id;
    const adminChatId = '1404191950';
    let total=Number("0");
    placeorder+="Item     Ordered Quantity     Cost \n";
    await delay(1000);
    Order.find({chat_id:chatId})
    .then(async doc=>{
      if(doc.length<1)
      {
        bot.sendMessage(chatId, 'You have not ordered any item to buy please select from menu by typing "/Showmenu"');
        await delay(1000);
      }
      else
      {
        const order=doc[0].orderlist;
        for(let i=0;i<12;i++)
        {
          if(order[i]!=0)
          {
            placeorder+=item[i]+'      '+order[i]+unit[i]+'                 '+order[i]*cost[i]+'/- \n';
            total+=(order[i]*cost[i]);
            doc[0].orderlist[i]=0;
            await delay(100);
          }
        }

        doc[0].save().then().catch();

        if(total===0)
        {
          bot.sendMessage(chatId, 'You have not selected any item to buy please select from menu by typing "/Showmenu"');
          await delay(1000);
        }
        else
        {
          if(total>=500)
          {
            placeorder+='Delivery Charges          0/- \n';
            await delay(100);
          }
          else
          {
            placeorder+='Delivery Charges          25/- \n';
            await delay(100);
            total+=25;
          }
          placeorder+="Total bill       "+total+"\n Deliver to: "+address+"\n";
          await delay(100);
          bot.sendMessage(adminChatId, placeorder);
          await delay(100);
          bot.sendMessage(chatId,'Your order will be delivered to '+address+'\n\n Thank You for ordering from SmartGrocering\n Have a Nice Day');
          bot.sendMessage(chatId, 'To place your order again either type "/start" or "/Showmenu"');
        }
      }
    })
    
    

   }
})

bot.onText(/\/Cancel/, async (msg)=>{
    const chatId=msg.chat.id;
    Order.find({chat_id:chatId})
    .then(doc=>{
      if(doc.length<1)
      {
        bot.sendMessage(chatId,'You have not ordered anything');
        bot.sendMessage(chatId, 'To place your order either type "/start" or "/Showmenu"');
      }
      else
      {
        let x=null;
        for(let i=0;i<12;i++)
        {
          if(doc[0].orderlist[i]>0)
          {
            x=1;
            doc[0].orderlist[i]=0;
          }
        }
        if(x==null)
        {
          bot.sendMessage(chatId,'You have not ordered anything');
          bot.sendMessage(chatId, 'To place your order either type "/start" or "/Showmenu"');
        }
        else
        {
          doc[0].save().then().catch();
          bot.sendMessage(chatId,'Your order is cancelled');
          bot.sendMessage(chatId, 'To place your order again either type "/start" or "/Showmenu"');
        }
      }
    })
})