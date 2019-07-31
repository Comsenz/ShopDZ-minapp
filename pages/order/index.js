// pages/coupon/index.js
const app = getApp();
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabIndex: 1,
    list: [],
    page:1,
    is_display:false,
    order_list:[],
    order_sn:null,
    is_delete:false,
    is_receiving:false,
    is_order:false,
    is_order_sn:null,
  },
  goDetail:(e)=>{
    var order_sn = e.currentTarget.dataset.order_sn;
    wx.navigateTo({
      url: '../detail/detail?order_sn='+order_sn,
    })
  },
  orderdetails: function (order_sn){
    var self = this;
    var key = wx.getStorageSync('key');
    var order_list = new Array();
    var arr = [];
    for (var i = 0; i < order_sn.length; i++) {
      console.log(order_sn[i]);
      wx.request({
        url: curl + 'api.php/orders/orderdetails',
        data: { key: key, order_sn: order_sn[i] },
        method: 'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded' // 默认值
        },
        success: function (res) {
          if(res.data.code == 0){
            for (var i = 0; i < res.data.data.gooddetails.length; i++) {
              res.data.data.gooddetails[i].order_sn = res.data.data.order_sn;
            }
            order_list.push(res.data.data.gooddetails);
            self.setData({
              order_list: order_list,
            });
          }
        },
      })
    }
  },
  is_display: function (e){
    var self = this;
    var order_sn = e.currentTarget.dataset.id;
    var is_display = e.currentTarget.dataset.is_display;
    var list = self.data.list;
    var display = null;
    for (var i = 0; i < list.length; i++) {
      if (order_sn == list[i].order_sn){
        if(is_display == 1){
          list[i].is_display = 0;
        }else{
          list[i].is_display = 1;
        }
      }
    }
    console.log(list);
    self.setData({
      list: list,
    });
  },
  //获取所有订单
  getList:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    var list = self.data.list;
    // var key = '69442fa8fbc026f39fcf2bb7fd7b99a3';
    var page = self.data.page;
    wx.request({
      url: curl +'api.php/orders/getmyorders',
      data:{key:key,page:page},
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      success:function(res){
        if(res.data.code == 0){
          if (res.data.data.orderlist.length == 8){
            var is_reach = true;
            page++;
          }else{
            var is_reach = false;
          }
          console.log(is_reach);
          var orderlist = list.concat(res.data.data.orderlist);
          var arr = [];
          for (var i = 0; i < orderlist.length; i++) {
            arr.push(orderlist[i].order_sn);
            orderlist[i].is_display = 0;
          }
          
          self.setData({
            list: orderlist,
            page:page,
            is_reach: is_reach,
          });
          self.orderdetails(arr);
        }
      }
    })
  },
  buy:function(e){
    var self = this;
    var pay_sn = e.currentTarget.dataset.id;
    var openid = wx.getStorageSync('openid');
    wx.request({
      url: curl + 'api.php/paymentwx/pay?payment_code=wxx&pay_sn=' + pay_sn + '&oid=' + openid,
      method: 'GET',
      success: function (res) {
        console.log(res);
        if (res.data.code == 0) {
          self.pay(res.data.data, pay_sn);
        }
      }
    })
  },
  pay: function (data, pay_sn) {
    var timeStamp = data.timeStamp;
    var nonceStr = data.nonceStr;
    var prepay_id = data.package;
    var signType = data.signType;
    var paySign = data.paySign;
    var pay_sn = pay_sn;
    wx.requestPayment({
      timeStamp: timeStamp,
      nonceStr: nonceStr,
      package: prepay_id,
      signType: signType,
      paySign: paySign,
      success: function (res) {
        if (res.errMsg == 'requestPayment:ok') {
          wx.navigateTo({
            url: '../detail/detail?order_sn=' + pay_sn,
          });
        }
      }
    })
  },
  //删除订单
  changeorder:function(e){
    var self = this;
    var key = wx.getStorageSync('key');
    var order_sn = e.currentTarget.dataset.id;
    var op = 'del';
    wx.showModal({
      title: '确定要删除此订单吗？',
      cancelText: "取消", //默认是“取消”
      confirmText: "确定", //默认是“确定”
      // showCancel:false,
      success(res) {
        if (res.cancel) {
          console.log('隐藏');
        } else {
          wx.request({
            url: curl + 'api.php/orders/changeorder',
            data: { key: key, order_sn: order_sn, op: op },
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded' // 默认值
            },
            success: function (res) {
              console.log(res);
              self.setData({
                is_delete: false,
                is_order_sn: null,
                list:[],
                page: 1,
              });
              self.getList();
              wx.showToast({
                title: '删除成功',
                icon: 'success',
                duration: 2000
              });
            }
          })
        }
      }
    })
  },
  //确认收货
  receiving:function(e){
    var self = this;
    var order_sn = e.currentTarget.dataset.id;
    var key = wx.getStorageSync('key');
    var op = 'ok';
    wx.showModal({
      title: '请确认您已收到了商品',
      cancelText: "取消", //默认是“取消”
      confirmText: "确定", //默认是“确定”
      // showCancel:false,
      success(res) {
        if (res.cancel) {
          console.log('隐藏');
        } else {
          wx.request({
            url: curl + 'api.php/orders/changeorder',
            data: { key: key, order_sn: order_sn, op: op },
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded' // 默认值
            },
            success: function (res) {
              console.log(res);
              self.setData({
                is_receiving: false,
                is_order_sn: null,
                list:[],
                page: 1,
              });
              self.getList();
            }
          })
        }
      }
    })
  },
  evaluate:function(e){
    var order_sn = e.currentTarget.dataset.id;
    var url = '../evaluate/index?order_sn=' + order_sn;
    wx.navigateTo({
      url: url,
    });
  },
  //删除订单显示按钮
  addressDel:function(e){
    var self = this;
    var order_sn = e.currentTarget.dataset.id;
    self.setData({
      is_delete: true,
      is_order_sn: order_sn,
    });
  },
  receiving_none:function(e){
    var self = this;
    var order_sn = e.currentTarget.dataset.id;
    self.setData({
      is_receiving: true,
      is_order_sn: order_sn,
    });
  },
  //删除订单隐藏按钮
  cancel_addressDel: function () {
    var self = this;
    self.setData({
      is_delete: false,
      is_order_sn: null,
      is_receiving:false,
      is_order: false,
    });
  },
  reason:function(e){
    var order_sn = e.currentTarget.dataset.id;
    var url = '../question/question?order_sn=' + order_sn;
    wx.navigateTo({
      url: url,
    });
  },
  //取消订单
  cancellation_order:function(e){
    var self = this;
    var key = wx.getStorageSync('key');
    var order_sn = e.currentTarget.dataset.id;
    var op = 'cancel';
    wx.showModal({
      title: '确定要取消此订单？',
      cancelText: "取消", //默认是“取消”
      confirmText: "确定", //默认是“确定”
      // showCancel:false,
      success(res) {
        if (res.cancel) {
          console.log('隐藏');
        } else {
          wx.request({
            url: curl + 'api.php/orders/changeorder',
            data: { key: key, order_sn: order_sn, op: op },
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded' // 默认值
            },
            success: function (res) {
              console.log(res);
              self.setData({
                is_order: false,
                is_order_sn: null,
                list:[],
                page: 1,
              });
              self.getList();
            }
          })
        }
      }
    })
    
  },
  //取消订单显示按钮
  order_del:function(e){
    var self = this;
    var order_sn = e.currentTarget.dataset.id;
    self.setData({
      is_order: true,
      is_order_sn: order_sn,
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // this.setData({
    //   tabIndex: options.type||1
    // })
    this.getList()
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
    this.setData({
      list:[],
      page: 1,
    })
    this.getList();
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
    if (this.data.is_reach){
      this.getList();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})