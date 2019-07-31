// pages/addressAdd/index.js
const app = getApp();
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
var WxParse = require('../../plugins/wxParse/wxParse.js');  
Page({

  /**
   * 页面的初始数据
   */
  data: {
    customItem: '全部',
    name:'',//姓名
    phone:'',//手机号
    timer:'',
    account:'',//可提现金额
    list:null,//提现信息
    number:'',//图形验证码
    address: null,//详情地址
    countDownNum: '60',//倒计时初始值
    style:null,
    is_default:0,
    minprice: '',
    maxprice: '',
    rand:null,
    addressIs:true,
    _id:null,
    
  },
  erweima:function(){
    var self = this;
    var rand = Math.random();
    self.setData({
      rand:rand,
    });

  },
  //姓名
  bindKeyName: function (e) {
    this.setData({
      name: e.detail.value
    })
  },
  bindKeyPhone:function(e){
    this.setData({
      phone: e.detail.value
    })
  },
  bindKeyNumer:function(e){
    this.setData({
      number: e.detail.value
    })
  },
  //详情地址
  bindKeyDetailed: function (e) {
    this.setData({
      address: e.detail.value
    })
  },
  // post:function(){
  //   var self = this;
  //   var key = wx.getStorageSync('key');
  //   var phone = self.data.phone;
  //   var number = self.data.number;
  //   if(!phone){
  //     console.log('验证手机不能为空');
  //     return;
  //   }
  //   if (!number){
  //     console.log('图形验证码不能为空');
  //     return;
  //   }

  //   wx.request({
  //     url: curl +'api.php/Spread/sendSeccode',
  //     data: { key: key, mobile: phone, verifyCode:number},
  //     method:'GET',
  //     success:function(res){
  //       console.log(res);
  //       self.setData({
  //         is_default:0,
  //       })
  //     }
  //   })
  // },

  submitFun:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    var openid = wx.getStorageSync('openid');

    var all_price = Number(self.data.account);
    var frozen_price = Number(self.data.number);
    if (frozen_price <= 0){
      wx.showToast({
        title: '请输入正确的提现金额！',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    console.log(frozen_price);
    console.log(all_price);
    if (all_price < frozen_price) {
      wx.showToast({
        title: '提现金额不能大于可提现金额！',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    if (frozen_price < self.data.minprice){
      wx.showToast({
        title: '提现金额小于最少提现金额！',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    if (frozen_price > self.data.maxprice) {
      wx.showToast({
        title: '提现金额大于最大提现金额！',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.request({
      url: curl +'api.php/Spread/getwxxcxwith',
      data: { key: key, cash_amount: frozen_price, openid: openid},
      method:'GET',
      success:function(res){
        console.log(res);
        wx.showToast({
          title: '申请成功，请等待管理员审核',
          icon: 'none',
          duration: 2000
        });
      }
    })
  },

  getList:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl +'api.php/Spread/getbank',
      data:{key:key},
      method:'GET',
      success:function(res){
        console.log(res);
        if(res.data.code == 0){
          var list = res.data.data.banksetting;
          console.log(list);
          self.setData({
            list:list,
            minprice: list.minprice,
            maxprice: list.maxprice,
          });
        }
      },
    })
  },
  getaccont:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl +'api.php/Spread/account',
      data:{key:key},
      method:'GET',
      success:function(res){
        if(res.data.code == 0){
          var account = res.data.data.settlement_price;
          self.setData({
            account: account
          });
        }
      }
    })

  },
  // //提交
  // submitFun:function(){
  //   var self = this;
  //   var key = wx.getStorageSync('key');
  //   var area_info = self.data.info_province + self.data.info_city + self.data.info_area;
  //   var params_wx = {
  //     key: key,
  //     true_name: self.data.name,
  //     province_id: self.data.province_id,
  //     city_id: self.data.city_id,
  //     area_id: self.data.area_id,
  //     area_info: area_info,
  //     address: self.data.address,
  //     tel_phone: self.data.phone,
  //     is_default: self.data.is_default,
  //   };
  //   wx.request({
  //     url: curl +'api.php/Member/addressAdd',
  //     data: params_wx,
  //     method:'POST',
  //     header: {
  //       'content-type': 'application/x-www-form-urlencoded' // 默认值
  //     },
  //     success:function(res){
  //       console.log(res);
  //       wx.navigateTo({
  //         url: '../addressList/index',
  //       });
  //     }
  //   })
  // },

  countDown: function () {
    let that = this;
    let countDownNum = that.data.countDownNum;//获取倒计时初始值
    //如果将定时器设置在外面，那么用户就看不到countDownNum的数值动态变化，所以要把定时器存进data里面
    that.setData({
      timer: setInterval(function () {//这里把setInterval赋值给变量名为timer的变量
        //每隔一秒countDownNum就减一，实现同步
        countDownNum--;
        //然后把countDownNum存进data，好让用户知道时间在倒计着
        that.setData({
          countDownNum: countDownNum
        })
        //在倒计时还未到0时，这中间可以做其他的事情，按项目需求来
        if (countDownNum == 0) {
          //这里特别要注意，计时器是始终一直在走的，如果你的时间为0，那么就要关掉定时器！不然相当耗性能
          //因为timer是存在data里面的，所以在关掉时，也要在data里取出后再关闭
          clearInterval(that.data.timer);
          //关闭定时器之后，可作其他处理codes go here
        }
      }, 1000)
    })
    if (countDownNum == 0){
      self.setData({
        is_default:1,
      });
    }
  },
  tishi:function(){
    wx.showToast({
      title: '小程序用户暂不支持其他提现方式',
      icon: 'none',
      duration: 2000
    });
  },

  explain:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl +'api.php/Spread/explain',
      data:{key:key},
      method:'GET',
      success:function(res){
        if(res.data.code == 0){
          var list = res.data.data.content;
          WxParse.wxParse('article', 'html', list, self, 5);
          self.setData({
            is_default:1,
          });
        }
      },  
    })
  },
  returns:function(){
    var self = this;
    self.setData({
      is_default:0,
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self = this; 
    self.getList();
    self.getaccont();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})